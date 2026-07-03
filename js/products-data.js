// ============ CATÁLOGO PADRÃO ============
// Usado como catálogo inicial (botão "Importar catálogo inicial" no painel admin)
// e como reserva enquanto o Firebase não estiver configurado.
const FALLBACK_PRODUCTS = [
  { id: "fallback-1", ordem: 1, nome: "Volume Natural", emoji: "✨", img: "img/produto-14c.jpeg", preco: 17.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-2", ordem: 2, nome: "Bolzani", emoji: "✨", img: "img/produto-bolzani.jpeg", preco: 18.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-3", ordem: 3, nome: "Mini Bolzani", emoji: "⭐", img: "img/produto-bolzani-mini.jpeg", preco: 18.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-4", ordem: 4, nome: "Efeito Volume Russo", emoji: "💫", img: "img/produto-g120.jpeg", preco: 18.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-5", ordem: 5, nome: "Cantinho Externo", emoji: "🦊", img: "img/produto-05.jpeg", preco: 14.99, precoAntigo: 17.99, status: "disponivel", tags: ["disponivel", "promocao"] },
  { id: "fallback-6", ordem: 6, nome: "Mega Volume Curvatura Perfeita", emoji: "🌙", img: "img/produto-015.jpeg", preco: 17.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-7", ordem: 7, nome: "Mini Volume Russo", emoji: "🌟", img: "img/produto-27.jpeg", preco: 17.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-8", ordem: 8, nome: "Efeito Gringo (2 unid.)", emoji: "✨", img: "img/produto-37.jpeg", preco: 16.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-9", ordem: 9, nome: "Modelo Gatinho", emoji: "🐱", img: "img/produto-c1.jpeg", preco: 17.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-10", ordem: 10, nome: "Volumão", emoji: "🙈", img: "img/produto-0604.jpeg", preco: 17.99, precoAntigo: null, status: "disponivel", tags: ["disponivel"] },
  { id: "fallback-11", ordem: 11, nome: "Fios Naturais", emoji: "🤍", img: "img/produto-c5.jpeg", preco: 17.99, precoAntigo: null, status: "esgotado", tags: [] },
  { id: "fallback-12", ordem: 12, nome: "Modelo Kim", emoji: "✨", img: "img/produto-hero.jpeg", preco: 17.99, precoAntigo: null, status: "esgotado", tags: [] },
  { id: "fallback-13", ordem: 13, nome: "Cola Branca · Macrilan", emoji: "🧴", img: null, preco: 18.99, precoAntigo: null, status: "disponivel", tags: ["disponivel", "acessorios"] },
  { id: "fallback-14", ordem: 14, nome: "Cílios p/ Maquiagem Artista", emoji: "🎨", img: null, preco: 4.99, precoAntigo: null, status: "disponivel", tags: ["disponivel", "acessorios"] },
];
