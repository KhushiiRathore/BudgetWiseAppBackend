const { GoogleGenerativeAI } = require("@google/generative-ai");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getSpendingAdvice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ message: "Question is required" });
        }

        // Fetch ALL expenses and income (not just last 30 days) so AI can answer date-specific questions
        const expenses = await Expense.find({ userId }).sort({ date: -1 });
        const incomes = await Income.find({ userId }).sort({ date: -1 });

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

        // Convert each transaction into a readable line
        const expenseList = expenses
            .map((e) => `${e.date.toDateString()} - ${e.category}: ₹${e.amount}`)
            .join("\n");

        const incomeList = incomes
            .map((i) => `${i.date.toDateString()} - ${i.source}: ₹${i.amount}`)
            .join("\n");

        const prompt = `
You are a helpful personal finance advisor. Here is the user's complete financial data:

Total Income (all time): ₹${totalIncome}
Total Expense (all time): ₹${totalExpense}

EXPENSE TRANSACTIONS:
${expenseList || "No expenses recorded"}

INCOME TRANSACTIONS:
${incomeList || "No income recorded"}

User's Question: "${question}"

Instructions:
- If the user asks about a specific date or category, search the transactions above and answer precisely using that data.
- If asking for general advice, analyze patterns and give practical suggestions.
- Keep your answer short, clear, and friendly (3-5 sentences max).
- Use ₹ symbol for amounts.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const advice = result.response.text();

        res.status(200).json({ advice });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};