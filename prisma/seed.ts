import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function diasAtras(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(12, 0, 0, 0);
  return d;
}

// Precisa respeitar as regras de src/lib/password.ts.
const SENHA_DEMO = "Campus@2026";

async function main() {
  await prisma.verificationAttempt.deleteMany();
  await prisma.match.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.foundItem.deleteMany();
  await prisma.user.deleteMany();

  const senha = await bcrypt.hash(SENHA_DEMO, 10);
  const criarUsuario = (name: string, email: string, phone: string) =>
    prisma.user.create({ data: { name, email, phone, password: senha } });

  const alice = await criarUsuario("Alice Souza", "alice@campus.edu", "(11) 99999-0001");
  const bruno = await criarUsuario("Bruno Lima", "bruno@campus.edu", "(11) 99999-0002");
  const carla = await criarUsuario("Carla Dias", "carla@campus.edu", "(11) 99999-0003");
  const diego = await criarUsuario("Diego Rocha", "diego@campus.edu", "(11) 99999-0004");

  const achados = [
    {
      category: "ELETRONICO",
      color: "Preto",
      location: "Biblioteca central",
      foundDate: diasAtras(1),
      description: "Fone de ouvido bluetooth encontrado perto das mesas de estudo do 2o andar",
      secretQuestion: "O que tem de especial na tampa do estojo de carregamento?",
      secretAnswer: "Tem um adesivo pequeno de um gato",
      userId: bruno.id,
    },
    {
      category: "CHAVE",
      color: "Prata",
      location: "Estacionamento",
      foundDate: diasAtras(2),
      description: "Molho de chaves encontrado no chao, perto da cancela de saida",
      secretQuestion: "Quantas chaves tem no molho e o que mais esta pendurado nele?",
      secretAnswer: "Tres chaves e um chaveiro de borracha vermelho",
      userId: carla.id,
    },
    {
      category: "BOLSA_MOCHILA",
      color: "Azul",
      location: "Cantina",
      foundDate: diasAtras(3),
      description: "Mochila azul deixada em uma das mesas do fundo depois do almoco",
      secretQuestion: "O que estava guardado no bolso da frente da mochila?",
      secretAnswer: "Um carregador branco e uma calculadora cientifica",
      userId: diego.id,
    },
    {
      category: "DOCUMENTO",
      color: "Bege",
      location: "Bloco A - sala 12",
      foundDate: diasAtras(1),
      description: "Carteira encontrada embaixo de uma carteira escolar apos a aula",
      secretQuestion: "Qual o nome completo que aparece nos documentos e o que mais tem dentro?",
      secretAnswer: "Alem dos documentos tem um cartao de transporte e uma foto 3x4",
      userId: bruno.id,
    },
    {
      category: "ROUPA_ACESSORIO",
      color: "Cinza",
      location: "Quadra poliesportiva",
      foundDate: diasAtras(4),
      description: "Moletom cinza esquecido no banco lateral da quadra",
      secretQuestion: "Tem alguma estampa ou marca no moletom? Qual?",
      secretAnswer: "Tem o escudo da faculdade bordado no peito esquerdo",
      userId: carla.id,
    },
    {
      category: "LIVRO_MATERIAL",
      color: "Vermelho",
      location: "Laboratorio de Quimica",
      foundDate: diasAtras(5),
      description: "Caderno universitario deixado na bancada do laboratorio",
      secretQuestion: "O que esta escrito na primeira pagina do caderno?",
      secretAnswer: "O nome da disciplina e o cronograma de provas",
      userId: diego.id,
    },
    {
      category: "ELETRONICO",
      color: "Branco",
      location: "Auditorio",
      foundDate: diasAtras(0),
      description: "Carregador de notebook encontrado na tomada da terceira fileira",
      secretQuestion: "Qual a marca do carregador e tem alguma marca de uso?",
      secretAnswer: "E da Dell e tem uma fita isolante enrolada perto do plug",
      userId: bruno.id,
    },
    {
      category: "OUTRO",
      color: "Rosa",
      location: "Bloco H - corredor",
      foundDate: diasAtras(2),
      description: "Garrafa termica encontrada no bebedouro do corredor",
      secretQuestion: "Tem algum adesivo ou marca na garrafa?",
      secretAnswer: "Tem dois adesivos de banda colados atras",
      userId: diego.id,
    },
  ] as const;

  for (const item of achados) {
    await prisma.foundItem.create({ data: { ...item, status: "AVAILABLE" } });
  }

  // Usa um item proprio, e nao um do feed: item em match sai do feed.
  const foneAchado = await prisma.foundItem.create({
    data: {
      category: "ELETRONICO",
      color: "Preto",
      location: "Biblioteca central",
      foundDate: diasAtras(1),
      description: "Fone de ouvido bluetooth encontrado perto das mesas de estudo do 2o andar",
      secretQuestion: "O que tem de especial na tampa do estojo de carregamento?",
      secretAnswer: "Tem um adesivo pequeno de um gato",
      status: "MATCHED",
      userId: bruno.id,
    },
  });

  const foneperdido = await prisma.lostItem.create({
    data: {
      category: "ELETRONICO",
      color: "Preto",
      location: "Biblioteca central",
      lostDate: diasAtras(2),
      description: "Fone de ouvido bluetooth preto com estojo de carregamento",
      status: "MATCHED",
      userId: alice.id,
    },
  });

  await prisma.match.create({
    data: { lostItemId: foneperdido.id, foundItemId: foneAchado.id, score: 100 },
  });

  await prisma.lostItem.create({
    data: {
      category: "ROUPA_ACESSORIO",
      color: "Preto",
      location: "Estacionamento",
      lostDate: diasAtras(6),
      description: "Guarda-chuva preto dobravel esquecido em algum lugar do campus",
      status: "PENDING_MATCH",
      userId: alice.id,
    },
  });

  const oculosPerdido = await prisma.lostItem.create({
    data: {
      category: "ROUPA_ACESSORIO",
      color: "Marrom",
      location: "Cantina",
      lostDate: diasAtras(20),
      description: "Oculos de grau com armacao marrom",
      status: "RESOLVED",
      userId: alice.id,
    },
  });
  const oculosAchado = await prisma.foundItem.create({
    data: {
      category: "ROUPA_ACESSORIO",
      color: "Marrom",
      location: "Cantina",
      foundDate: diasAtras(19),
      description: "Oculos de grau encontrado em cima da mesa da cantina",
      secretQuestion: "Como e o estojo do oculos?",
      secretAnswer: "Estojo rigido azul escuro",
      status: "RESOLVED",
      userId: carla.id,
    },
  });
  await prisma.match.create({
    data: {
      lostItemId: oculosPerdido.id,
      foundItemId: oculosAchado.id,
      score: 90,
      status: "RESOLVED",
      lostConfirmedDelivery: true,
      foundConfirmedDelivery: true,
    },
  });

  const totalAchados = await prisma.foundItem.count({ where: { status: "AVAILABLE" } });
  console.log("Seed concluido.");
  console.log(`  ${totalAchados} itens achados disponiveis no feed publico`);
  console.log("  Contas de teste (senha: Campus@2026):");
  console.log("    alice@campus.edu  - perdeu itens, tem match para verificar");
  console.log("    bruno@campus.edu  - achou itens");
  console.log("    carla@campus.edu / diego@campus.edu - acharam itens");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
