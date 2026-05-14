import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    await prisma.comment.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️  Cleaned existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@fixbuddy.com',
        password: adminPassword,
        name: 'Admin User',
        phone: '+1234567890',
        role: 'admin',
        status: 'active',
      },
    });
    console.log('✅ Created admin user:', admin.email);

    // Create agent users
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      const agentPassword = await bcrypt.hash('agent123', 10);
      const agent = await prisma.user.create({
        data: {
          email: `agent${i}@fixbuddy.com`,
          password: agentPassword,
          name: `Support Agent ${i}`,
          phone: `+123456789${i}`,
          role: 'agent',
          status: 'active',
          teamStatus: i === 1 || i === 2 ? 'available' : i === 3 ? 'on-break' : 'offline',
        },
      });
      agents.push(agent);
      console.log(`✅ Created agent:`, agent.name, `- Team Status: ${agent.teamStatus}`);
    }

    // Create regular users
    const customers = [];
    for (let i = 1; i <= 8; i++) {
      const userPassword = await bcrypt.hash('user123', 10);
      const user = await prisma.user.create({
        data: {
          email: `customer${i}@example.com`,
          password: userPassword,
          name: `Customer ${i}`,
          role: 'user',
          status: 'active',
        },
      });
      customers.push(user);
    }
    console.log(`✅ Created ${customers.length} customer users`);

    // Create tickets with different statuses and categories
    const categories = ['general', 'technical', 'billing'];
    const statuses = ['open', 'in_progress', 'closed', 'on_hold'];
    const priorities = ['low', 'medium', 'high', 'critical'];

    let ticketCount = 0;
    
    // General category tickets
    const generalTickets = [
      { title: 'Account access issues', description: 'Cannot log into my account', category: 'general', status: 'open', priority: 'high' },
      { title: 'Password reset needed', description: 'I forgot my password', category: 'general', status: 'in_progress', priority: 'medium' },
      { title: 'Profile update', description: 'Need to update my profile information', category: 'general', status: 'open', priority: 'low' },
    ];

    // Technical category tickets
    const technicalTickets = [
      { title: 'API connection error', description: 'Getting 503 error when connecting to API', category: 'technical', status: 'open', priority: 'critical' },
      { title: 'Performance issue', description: 'Application running slowly', category: 'technical', status: 'in_progress', priority: 'high' },
      { title: 'Mobile app crash', description: 'App crashes on startup', category: 'technical', status: 'in_progress', priority: 'high' },
      { title: 'Database sync issues', description: 'Data not syncing properly', category: 'technical', status: 'open', priority: 'critical' },
    ];

    // Billing category tickets
    const billingTickets = [
      { title: 'Invoice discrepancy', description: 'Found error in latest invoice', category: 'billing', status: 'open', priority: 'medium' },
      { title: 'Refund request', description: 'Requesting refund for overcharge', category: 'billing', status: 'in_progress', priority: 'high' },
      { title: 'Payment plan change', description: 'Want to switch to different plan', category: 'billing', status: 'open', priority: 'low' },
    ];

    const allTickets = [...generalTickets, ...technicalTickets, ...billingTickets];

    for (let i = 0; i < allTickets.length; i++) {
      const ticketData = allTickets[i];
      const customer = customers[i % customers.length];
      const assignedAgent = ticketData.status === 'in_progress' || ticketData.status === 'closed' 
        ? agents[i % agents.length] 
        : null;

      const ticket = await prisma.ticket.create({
        data: {
          title: ticketData.title,
          description: ticketData.description,
          category: ticketData.category,
          status: ticketData.status,
          priority: ticketData.priority,
          createdById: customer.id,
          assignedToId: assignedAgent?.id || null,
          // Add mock intelligence data
          confidence: Math.random() * (0.98 - 0.65) + 0.65, // 65-98% confidence
          sentiment: {
            score: Math.random() * 2 - 1, // -1 to 1
            label: Math.random() > 0.5 ? 'positive' : 'negative',
            confidence: Math.random() * (0.95 - 0.60) + 0.60
          },
          intelligenceData: {
            predicted_category: ticketData.category,
            prediction_confidence: Math.random() * (0.99 - 0.70) + 0.70,
            suggested_priority: ticketData.priority,
            is_duplicate: Math.random() > 0.85, // 15% chance of duplicate
            duplicate_of_id: null,
            suggested_agent: assignedAgent?.name || 'General Queue',
            routing_score: Math.random() * (0.98 - 0.60) + 0.60,
            complexity_score: Math.floor(Math.random() * 100),
            urgency_score: Math.floor(Math.random() * 100),
            processing_time_estimate: Math.floor(Math.random() * 240) + 15, // 15-255 minutes
            ai_notes: 'Analyzed by AI classification engine',
            tags: ['auto-classified', ticketData.category]
          }
        },
      });

      ticketCount++;

      // Create activity log for ticket
      await prisma.activity.create({
        data: {
          type: 'ticket_created',
          details: `Ticket ${ticket.id} created`,
          userId: customer.id,
          ticketId: ticket.id,
        },
      });

      // Create activity if assigned
      if (assignedAgent) {
        await prisma.activity.create({
          data: {
            type: 'ticket_assigned',
            details: `Ticket assigned to ${assignedAgent.name}`,
            userId: admin.id,
            ticketId: ticket.id,
          },
        });
      }
    }

    console.log(`✅ Created ${ticketCount} tickets with various statuses and categories`);

    // Create sample comments on some tickets
    const ticketsForComments = await prisma.ticket.findMany({ take: 5 });
    for (const ticket of ticketsForComments) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      await prisma.comment.create({
        data: {
          content: 'We are investigating the issue and will provide an update shortly.',
          type: 'response',
          ticketId: ticket.id,
          userId: agent.id,
        },
      });
    }
    console.log(`✅ Added sample comments to tickets`);

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`  - Admins: 1`);
    console.log(`  - Agents: ${agents.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Tickets: ${ticketCount}`);
    
    const queueStatus = await prisma.ticket.groupBy({
      by: ['category', 'status'],
      where: { status: { in: ['open', 'in_progress'] } },
      _count: true,
    });
    console.log(`\n📋 Current Queue Status:`);
    queueStatus.forEach(item => {
      console.log(`  - ${item.category} (${item.status}): ${item._count} tickets`);
    });

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
