// ============ ESTADO ============
let currentProducts = [];
let editingId = null;
let unsubscribeProducts = null;
// pendingImg: undefined = não mexeu na foto (mantém a atual, se estiver editando);
// null = removeu a foto; string (data URL) = escolheu uma foto nova.
let pendingImg = undefined;

// ============ LOGIN / AUTENTICAÇÃO ============
function bindLogin(){
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginPassword").value;
    const auth = fbAuth();

    if(!auth){
      errorEl.textContent = "Firebase não configurado. Veja CONFIGURAR-FIREBASE.md.";
      return;
    }

    try{
      await auth.signInWithEmailAndPassword(email, senha);
    }catch(err){
      errorEl.textContent = mensagemErroLogin(err);
      console.warn("Erro de login:", err.code, err.message);
    }
  });
}

function mensagemErroLogin(err){
  const codigo = err && err.code;
  if(codigo === "auth/user-not-found" || codigo === "auth/wrong-password" || codigo === "auth/invalid-credential"){
    return "E-mail ou senha inválidos.";
  }
  if(codigo === "auth/invalid-email"){
    return "E-mail em formato inválido.";
  }
  if(codigo === "auth/too-many-requests"){
    return "Muitas tentativas erradas. Aguarde um pouco e tente de novo.";
  }
  if(codigo === "auth/configuration-not-found" || codigo === "auth/operation-not-allowed"){
    return "O login por e-mail/senha ainda não foi ativado no Firebase (Authentication > Sign-in method).";
  }
  if(codigo === "auth/network-request-failed"){
    return "Sem conexão com o Firebase. Verifique sua internet.";
  }
  return `Erro ao entrar (${codigo || "desconhecido"}). Veja o console (F12) para detalhes.`;
}

function bindLogout(){
  document.getElementById("logoutBtn").addEventListener("click", () => {
    const auth = fbAuth();
    if(auth) auth.signOut();
  });
}

function watchAuthState(){
  const auth = fbAuth();
  if(!auth){
    document.getElementById("firebaseWarning").hidden = false;
    return;
  }

  auth.onAuthStateChanged(user => {
    document.getElementById("loginScreen").hidden = !!user;
    document.getElementById("dashboard").hidden = !user;

    if(user){
      startProductsListener();
    }else if(unsubscribeProducts){
      unsubscribeProducts();
      unsubscribeProducts = null;
    }
  });
}

// ============ LISTA DE PRODUTOS ============
// Na primeira vez que o painel abre com o banco vazio, copiamos o catálogo
// padrão automaticamente — sem botão, sem mensagem pedindo ação. Assim os
// produtos que a Leandra já vê na tela são sempre registros de verdade,
// editáveis e excluíveis desde o primeiro segundo.
let seedEmAndamento = false;

function startProductsListener(){
  unsubscribeProducts = subscribeProducts(async (products, erro) => {
    currentProducts = products;
    renderAdminList(products);

    const banner = document.getElementById("syncError");
    if(erro){
      banner.hidden = false;
      banner.textContent = `Não foi possível sincronizar com o Firestore agora (mostrando catálogo local): ${erro.message || erro.code || erro}`;
      return;
    }
    banner.hidden = true;

    const isEmptyCloud = products === FALLBACK_PRODUCTS;
    if(isEmptyCloud && !seedEmAndamento){
      seedEmAndamento = true;
      document.getElementById("emptyMsg").hidden = false;
      try{
        await seedInitialProducts();
        // A própria escuta em tempo real vai receber os produtos reais em seguida.
      }catch(err){
        banner.hidden = false;
        banner.textContent = "Erro ao preparar o catálogo inicial: " + err.message;
      }finally{
        seedEmAndamento = false;
      }
    }
  });
}

function renderAdminList(products){
  const list = document.getElementById("adminList");
  const isEmptyCloud = products === FALLBACK_PRODUCTS;

  document.getElementById("emptyMsg").hidden = !isEmptyCloud;

  list.innerHTML = products.map(p => `
    <div class="admin-card">
      <div class="admin-card-thumb">
        ${p.img
          ? `<img src="${p.img}" alt="${p.nome}">`
          : `<div class="product-placeholder"><span class="ph-emoji">${p.emoji || "✨"}</span></div>`}
      </div>
      <div class="admin-card-info">
        <h4>${p.emoji || ""} ${p.nome}</h4>
        <p>R$ ${formatPrice(p.preco)} ${p.precoAntigo ? `<s>R$ ${formatPrice(p.precoAntigo)}</s>` : ""}</p>
      </div>
      <label class="switch" title="Disponível / Esgotado">
        <input type="checkbox" ${p.status === "disponivel" ? "checked" : ""} ${isEmptyCloud ? "disabled" : ""} data-toggle-id="${p.id}">
        <span class="slider"></span>
      </label>
      <div class="admin-card-actions">
        <button type="button" data-edit-id="${p.id}" ${isEmptyCloud ? "disabled" : ""}>Editar</button>
        <button type="button" class="danger" data-delete-id="${p.id}" ${isEmptyCloud ? "disabled" : ""}>Excluir</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-toggle-id]").forEach(el => {
    el.addEventListener("change", async () => {
      const id = el.dataset.toggleId;
      const product = currentProducts.find(p => p.id === id);
      const novoStatus = el.checked ? "disponivel" : "esgotado";
      try{
        await updateProduct(id, { status: novoStatus, tags: rebuildTags(novoStatus, product.tags) });
      }catch(err){
        alert("Erro ao atualizar: " + err.message);
        el.checked = !el.checked;
      }
    });
  });

  list.querySelectorAll("[data-edit-id]").forEach(el => {
    el.addEventListener("click", () => startEdit(el.dataset.editId));
  });

  list.querySelectorAll("[data-delete-id]").forEach(el => {
    el.addEventListener("click", async () => {
      const id = el.dataset.deleteId;
      const product = currentProducts.find(p => p.id === id);
      if(!confirm(`Excluir "${product ? product.nome : "este produto"}" definitivamente?`)) return;
      try{
        await deleteProduct(id);
        if(editingId === id) resetForm();
      }catch(err){
        alert("Erro ao excluir: " + err.message);
      }
    });
  });
}

function rebuildTags(status, existingTags){
  const kept = (existingTags || []).filter(t => t !== "disponivel");
  if(status === "disponivel") kept.push("disponivel");
  return kept;
}

// ============ FOTO (upload da galeria/câmera, com compressão no navegador) ============
// Evita estourar o limite de 1MB por documento do Firestore: redesenha a imagem
// num <canvas> menor e exporta como JPEG comprimido antes de salvar.
function comprimirImagem(file, larguraMax = 900, qualidade = 0.72){
  return new Promise((resolve, reject) => {
    if(!file.type.startsWith("image/")){
      reject(new Error("Escolha um arquivo de imagem (JPG, PNG, etc)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Esse arquivo não parece ser uma imagem válida."));
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function mostrarPreviewImagem(src){
  const preview = document.getElementById("imagemPreview");
  const removeBtn = document.getElementById("removeImagemBtn");
  if(src){
    preview.src = src;
    preview.hidden = false;
    removeBtn.hidden = false;
  }else{
    preview.src = "";
    preview.hidden = true;
    removeBtn.hidden = true;
  }
}

function bindImagemField(){
  const fileInput = document.getElementById("fieldImagemArquivo");

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if(!file) return;
    try{
      pendingImg = await comprimirImagem(file);
      mostrarPreviewImagem(pendingImg);
    }catch(err){
      alert(err.message);
    }
  });

  document.getElementById("removeImagemBtn").addEventListener("click", () => {
    pendingImg = null;
    mostrarPreviewImagem(null);
  });
}

// ============ FORMULÁRIO (ADICIONAR / EDITAR) ============
function bindForm(){
  const form = document.getElementById("productForm");
  const precoAntigoWrap = document.getElementById("precoAntigoWrap");
  const promocaoCheck = document.getElementById("fieldPromocao");

  promocaoCheck.addEventListener("change", () => {
    precoAntigoWrap.hidden = !promocaoCheck.checked;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("fieldNome").value.trim();
    const emoji = document.getElementById("fieldEmoji").value.trim() || "✨";
    const preco = parseFloat(document.getElementById("fieldPreco").value);
    const status = document.getElementById("fieldStatus").value;
    const isPromocao = promocaoCheck.checked;
    const isAcessorio = document.getElementById("fieldAcessorio").checked;
    const precoAntigoRaw = document.getElementById("fieldPrecoAntigo").value;
    const precoAntigo = isPromocao && precoAntigoRaw ? parseFloat(precoAntigoRaw) : null;

    if(!nome || Number.isNaN(preco)){
      alert("Preencha ao menos o nome e o preço.");
      return;
    }

    const tags = [];
    if(status === "disponivel") tags.push("disponivel");
    if(isPromocao) tags.push("promocao");
    if(isAcessorio) tags.push("acessorios");

    // Se a pessoa não mexeu no campo de foto: mantém a foto atual (edição) ou fica sem foto (produto novo).
    const fotoAtual = editingId ? (currentProducts.find(p => p.id === editingId) || {}).img || null : null;
    const img = pendingImg !== undefined ? pendingImg : fotoAtual;

    const data = { nome, emoji, img, preco, precoAntigo, status, tags };

    try{
      if(editingId){
        await updateProduct(editingId, data);
      }else{
        const maiorOrdem = currentProducts.reduce((max, p) => Math.max(max, p.ordem || 0), 0);
        await addProduct({ ...data, ordem: maiorOrdem + 1 });
      }
      resetForm();
    }catch(err){
      alert("Erro ao salvar: " + err.message);
    }
  });

  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);
}

function startEdit(id){
  const p = currentProducts.find(x => x.id === id);
  if(!p) return;

  editingId = id;
  pendingImg = undefined;
  document.getElementById("fieldNome").value = p.nome || "";
  document.getElementById("fieldEmoji").value = p.emoji || "";
  document.getElementById("fieldPreco").value = p.preco || "";
  document.getElementById("fieldStatus").value = p.status || "disponivel";
  mostrarPreviewImagem(p.img || null);

  const isPromocao = (p.tags || []).includes("promocao");
  document.getElementById("fieldPromocao").checked = isPromocao;
  document.getElementById("fieldAcessorio").checked = (p.tags || []).includes("acessorios");
  document.getElementById("precoAntigoWrap").hidden = !isPromocao;
  document.getElementById("fieldPrecoAntigo").value = p.precoAntigo || "";

  document.getElementById("formTitle").textContent = `Editando: ${p.nome}`;
  document.getElementById("cancelEditBtn").hidden = false;
  document.getElementById("productForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm(){
  editingId = null;
  pendingImg = undefined;
  document.getElementById("productForm").reset();
  mostrarPreviewImagem(null);
  document.getElementById("precoAntigoWrap").hidden = true;
  document.getElementById("formTitle").textContent = "Adicionar novo produto";
  document.getElementById("cancelEditBtn").hidden = true;
}

// ============ INIT ============
// A ordem importa: primeiro ligamos os botões/formulários (não dependem do
// Firebase), só depois checamos o estado de login. Assim, mesmo se o Firebase
// falhar ao carregar, a página nunca fica com botões "mortos".
document.addEventListener("DOMContentLoaded", () => {
  bindLogin();
  bindLogout();
  bindImagemField();
  bindForm();
  try{
    watchAuthState();
  }catch(err){
    console.warn("Erro ao checar estado de login:", err);
    document.getElementById("firebaseWarning").hidden = false;
  }
});
