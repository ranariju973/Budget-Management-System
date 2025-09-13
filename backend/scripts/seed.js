const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Borrowing = require('../models/Borrowing');
const Lending = require('../models/Lending');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Budget.deleteMany({}),
      Expense.deleteMany({}),
      Borrowing.deleteMany({}),
      Lending.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create sample user
    const sampleUser = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
      passwordHash: 'password123' // Will be hashed by pre-save middleware
    });

    await sampleUser.save();
    console.log('Created sample user:', sampleUser.email);

    // Create sample budget for current month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const currentBudget = new Budget({
      userId: sampleUser._id,
      year: currentYear,
      monthNumber: currentMonth,
      income: 75000
    });

    await currentBudget.save();
    console.log(`Created current budget for ${currentYear}-${currentMonth}`);

    // Create sample budget for previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousBudget = new Budget({
      userId: sampleUser._id,
      year: previousYear,
      monthNumber: previousMonth,
      income: 70000
    });

    await previousBudget.save();
    console.log(`Created previous budget for ${previousYear}-${previousMonth}`);

    // Sample expenses for current budget
    const currentExpenses = [
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Grocery Shopping',
        category: 'Food & Dining',
        amount: 8000,
        date: new Date(currentYear, currentMonth - 1, 5),
        notes: 'Weekly groceries from Big Bazaar'
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Petrol',
        category: 'Transportation',
        amount: 3500,
        date: new Date(currentYear, currentMonth - 1, 7),
        notes: 'Fuel for the car'
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Netflix Subscription',
        category: 'Entertainment',
        amount: 649,
        date: new Date(currentYear, currentMonth - 1, 1),
        notes: 'Monthly streaming subscription'
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Electricity Bill',
        category: 'Bills & Utilities',
        amount: 2500,
        date: new Date(currentYear, currentMonth - 1, 15),
        notes: 'Monthly electricity bill'
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Dinner at Restaurant',
        category: 'Food & Dining',
        amount: 1800,
        date: new Date(currentYear, currentMonth - 1, 12),
        notes: 'Family dinner at Barbeque Nation'
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        name: 'Online Course',
        category: 'Education',
        amount: 4999,
        date: new Date(currentYear, currentMonth - 1, 3),
        notes: 'Full Stack Development course on Unacademy'
      }
    ];

    await Expense.insertMany(currentExpenses);
    console.log(`Created ${currentExpenses.length} sample expenses for current budget`);

    // Sample expenses for previous budget
    const previousExpenses = [
      {
        userId: sampleUser._id,
        budgetId: previousBudget._id,
        name: 'Rent Payment',
        category: 'Bills & Utilities',
        amount: 25000,
        date: new Date(previousYear, previousMonth - 1, 1),
        notes: 'Monthly rent payment'
      },
      {
        userId: sampleUser._id,
        budgetId: previousBudget._id,
        name: 'Coffee Shop',
        category: 'Food & Dining',
        amount: 450,
        date: new Date(previousYear, previousMonth - 1, 10),
        notes: 'Work meeting at Cafe Coffee Day'
      },
      {
        userId: sampleUser._id,
        budgetId: previousBudget._id,
        name: 'Gym Membership',
        category: 'Sports & Fitness',
        amount: 2000,
        date: new Date(previousYear, previousMonth - 1, 1),
        notes: 'Monthly gym membership at Anytime Fitness'
      }
    ];

    await Expense.insertMany(previousExpenses);
    console.log(`Created ${previousExpenses.length} sample expenses for previous budget`);

    // Sample borrowings
    const sampleBorrowings = [
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        lenderName: 'Mike Johnson',
        amount: 15000,
        date: new Date(currentYear, currentMonth - 1, 8),
        notes: 'Emergency car repair loan',
        isRepaid: false
      },
      {
        userId: sampleUser._id,
        budgetId: previousBudget._id,
        lenderName: 'Sarah Wilson',
        amount: 5000,
        date: new Date(previousYear, previousMonth - 1, 15),
        notes: 'Festival shopping money',
        isRepaid: true,
        repaidDate: new Date(previousYear, previousMonth - 1, 25)
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        lenderName: 'Credit Card',
        amount: 8000,
        date: new Date(currentYear, currentMonth - 1, 20),
        notes: 'Advance payment for vacation',
        isRepaid: false
      }
    ];

    await Borrowing.insertMany(sampleBorrowings);
    console.log(`Created ${sampleBorrowings.length} sample borrowings`);

    // Sample lendings (money you've lent to others)
    const sampleLendings = [
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        borrowerName: 'Rahul Sharma',
        amount: 10000,
        date: new Date(currentYear, currentMonth - 1, 5),
        notes: 'Personal loan for medical emergency',
        isRepaid: false
      },
      {
        userId: sampleUser._id,
        budgetId: previousBudget._id,
        borrowerName: 'Priya Patel',
        amount: 5000,
        date: new Date(previousYear, previousMonth - 1, 12),
        notes: 'Wedding expenses loan',
        isRepaid: true,
        repaidDate: new Date(previousYear, previousMonth - 1, 28)
      },
      {
        userId: sampleUser._id,
        budgetId: currentBudget._id,
        borrowerName: 'Amit Kumar',
        amount: 7500,
        date: new Date(currentYear, currentMonth - 1, 18),
        notes: 'Business startup loan',
        isRepaid: false
      }
    ];

    await Lending.insertMany(sampleLendings);
    console.log(`Created ${sampleLendings.length} sample lendings`);

    console.log('\n=== Seed Data Summary ===');
    console.log(`User: ${sampleUser.name} (${sampleUser.email})`);
    console.log(`Password: password123`);
    console.log(`Current Budget: ₹${currentBudget.income} for ${currentYear}-${currentMonth}`);
    console.log(`Previous Budget: ₹${previousBudget.income} for ${previousYear}-${previousMonth}`);
    console.log(`Total Expenses: ${currentExpenses.length + previousExpenses.length}`);
    console.log(`Total Borrowings: ${sampleBorrowings.length}`);
    console.log(`Total Lendings: ${sampleLendings.length}`);
    console.log('========================\n');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedData();
