# TravelSplit - Smart Travel Expense Splitting 🌍✈️

TravelSplit is a modern, mobile-first React application designed to simplify expense tracking and splitting for group travel. With AI-powered receipt scanning and intuitive settlement features, it takes the headache out of "who owes who."

![App Screenshot](https://raw.githubusercontent.com/TheNickDeveloper/Travel-Spliter-POC/main/screenshot.png)
*(Note: Replace with actual hosted screenshot URL if available)*

## ✨ Key Features

### 🤖 AI-Powered Receipt Scanning
- **Auto-Fill**: Snap a photo of your receipt, and our AI (powered by Google Gemini) automatically extracts the title, amount, currency, category, date, and location.
- **Smart Summarization**: Recognizes receipts in multiple languages and summarizes them into clear, concise expense entries.

### 💰 Expense Management
- **Flexible Splitting**: Support for unequal splits. Choose exactly who participated in each expense.
- **Multi-Currency Support**: Record expenses in various currencies (TWD, USD, JPY, EUR, etc.). The app automatically converts them to your trip's base currency for consistent tracking.
- **Visual Charts**: Interactive pie charts to visualize spending breakdown by category (Food, Transport, Accommodation, etc.).

### 🤝 Smart Settlement
- **Debts Simplified**: Automatically calculates the most efficient way to settle debts among all members.
- **Clear Net Balances**: Shows exactly who needs to pay whom to "complete" the trip's finances.

### 👥 Trip & Member Management
- **Multiple Trips**: Manage different trips (e.g., "Bangkok 2024", "Tokyo Trip") separately.
- **Easy Member Add/Remove**: Quickly add friends to your trip and manage their profiles.

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (@google/genai)

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- A Google Gemini API Key (for AI features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YourUsername/Travel-Spliter-POC.git
    cd Travel-Spliter-POC
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    gemini_api_key=YOUR_ACTUAL_API_KEY
    GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the app**
    Visit `http://localhost:3000` (or the port shown in your terminal).

## 📖 Usage Guide

1.  **Create a Trip**: Click "換行程" (Change Trip) -> Enter a name -> Click "+".
2.  **Add Members**: Go to the "Members" tab -> Type a name -> Add.
3.  **Track Expenses**: Click the big "+" button.
    *   **Manual**: Enter details manually.
    *   **AI Scan**: Click the Camera icon, upload a receipt image, and watch it auto-fill!
4.  **Settle Up**: Click the "Settlement" (coin/user) icon to see the breakdown of debts.

## 📄 License

This project is licensed under the MIT License.
