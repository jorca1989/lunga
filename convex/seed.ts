import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx: any) => {
    // 1. Check if database has users
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return "O banco de dados já possui dados.";
    }

    // 2. Create users
    const user1Id = await ctx.db.insert("users", {
      name: "Manuel Dos Santos",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: "citizen",
      reputation: 145,
      badges: ["Primeiro Alerta", "Caçador de Lixo", "Guardião da Via"],
      phoneNumber: "+244912345678",
    });

    const user2Id = await ctx.db.insert("users", {
      name: "Ana Bela Costa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: "citizen",
      reputation: 85,
      badges: ["Primeiro Alerta"],
      phoneNumber: "+244912345679",
    });

    const user3Id = await ctx.db.insert("users", {
      name: "João Francisco",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "operator",
      reputation: 210,
      badges: ["Vigilante Cívico", "Super Cidadão"],
      phoneNumber: "+244912345680",
    });

    // 3. Create reports
    const report1Id = await ctx.db.insert("reports", {
      tenantId: "cazenga",
      userId: user1Id,
      category: "Lixo",
      title: "Acumulação de Lixo na Via Pública",
      description: "Contentores transbordando na berma da estrada principal do Cazenga. O lixo está a espalhar-se pela via impedindo a circulação de pedestres.",
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
      location: "Avenida Hoji Ya Henda",
      latitude: -8.8159,
      longitude: 13.2922,
      status: "Aberto",
      likes: 45,
      commentsCount: 2,
      createdAt: Date.now() - 600000, // 10 mins ago
    });

    const report2Id = await ctx.db.insert("reports", {
      tenantId: "cazenga",
      userId: user2Id,
      category: "Buracos",
      title: "Buraco Crítico na Faixa Central",
      description: "Um buraco enorme e profundo abriu-se mesmo no meio da estrada. Muito perigoso para viaturas ligeiras e motorizadas à noite.",
      image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80",
      location: "Rua Direita da Samba",
      latitude: -8.8475,
      longitude: 13.2208,
      status: "Em Progresso",
      likes: 67,
      commentsCount: 1,
      createdAt: Date.now() - 7200000, // 2 hours ago
    });

    await ctx.db.insert("reports", {
      tenantId: "cazenga",
      userId: user3Id,
      category: "Água",
      title: "Ruptura de Conduta de Água",
      description: "Desperdício de grande quantidade de água limpa jorrando debaixo do passeio há mais de 24 horas. Risco de erosão da estrada.",
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80",
      location: "Rua do Kero",
      latitude: -8.9169,
      longitude: 13.1932,
      status: "Resolvido",
      likes: 112,
      commentsCount: 0,
      createdAt: Date.now() - 86400000, // 1 day ago
    });

    // 4. Create comments
    await ctx.db.insert("comments", {
      reportId: report1Id,
      userId: user2Id,
      content: "Isto está mesmo insuportável, o cheiro chega às casas vizinhas.",
      createdAt: Date.now() - 300000,
    });

    await ctx.db.insert("comments", {
      reportId: report1Id,
      userId: user3Id,
      content: "Já reportamos à administração municipal, aguardamos resposta.",
      createdAt: Date.now() - 100000,
    });

    await ctx.db.insert("comments", {
      reportId: report2Id,
      userId: user1Id,
      content: "Eu passei por aí ontem à noite e quase bati com o carro! Cuidado!",
      createdAt: Date.now() - 3600000,
    });

    // 5. Create cleanup jobs
    // Open report 1: Pending cleanup job
    await ctx.db.insert("cleanupJobs", {
      reportId: report1Id,
      status: "Pendente",
    });

    // In Progress report 2: Accepted cleanup job assigned to operator user3Id
    await ctx.db.insert("cleanupJobs", {
      reportId: report2Id,
      operatorId: user3Id,
      status: "Aceito",
      assignedAt: Date.now() - 3600000,
      beforeImage: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600",
    });

    // 6. Create audit logs
    // Audit logs for Report 1 (Open)
    await ctx.db.insert("auditLogs", {
      reportId: report1Id,
      userId: user1Id,
      action: "Criado",
      notes: "Ocorrência de lixo registada pelo cidadão Manuel Dos Santos.",
      createdAt: Date.now() - 600000,
    });

    // Audit logs for Report 2 (In Progress)
    await ctx.db.insert("auditLogs", {
      reportId: report2Id,
      userId: user2Id,
      action: "Criado",
      notes: "Ocorrência de buraco na estrada registada por Ana Bela Costa.",
      createdAt: Date.now() - 7200000,
    });
    await ctx.db.insert("auditLogs", {
      reportId: report2Id,
      userId: user3Id, // supervisor role placeholder / administrative approval
      action: "Em Análise",
      notes: "Ocorrência aprovada pela administração municipal e enviada para o mercado de limpeza.",
      createdAt: Date.now() - 5400000,
    });
    await ctx.db.insert("auditLogs", {
      reportId: report2Id,
      userId: user3Id,
      action: "Em Progresso",
      notes: "Serviço de reparação e limpeza aceito pelo operador João Francisco.",
      createdAt: Date.now() - 3600000,
    });

    return "Banco de dados inicializado com sucesso com ocorrências, comentários, auditoria e trabalhos!";
  },
});
