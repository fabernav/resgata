import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tentativas = await prisma.verificationAttempt.deleteMany();
  const matches = await prisma.match.deleteMany();
  const perdidos = await prisma.lostItem.deleteMany();
  const achados = await prisma.foundItem.deleteMany();
  const usuarios = await prisma.user.deleteMany();

  console.log("Banco limpo:");
  console.log(`  ${usuarios.count} contas removidas`);
  console.log(`  ${perdidos.count} itens perdidos removidos`);
  console.log(`  ${achados.count} itens achados removidos`);
  console.log(`  ${matches.count} matches removidos`);
  console.log(`  ${tentativas.count} tentativas de verificacao removidas`);
  console.log("");
  console.log("O banco esta vazio. Cadastre as contas do zero para testar.");
  console.log("Para voltar ao cenario de demonstracao: npm run db:seed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
