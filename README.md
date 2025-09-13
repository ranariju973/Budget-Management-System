# Budget Management Web App

A complete budget management application built with React frontend and Node.js backend, allowing users to track their monthly income, expenses, and borrowings.
- Categorized expenses (Food, Transportation, Bills, etc.)
- Date-based tracking with notes
- Visual expense breakdown with pie charts

### Borrowing Management
- Track borrowed money with lender details
- Mark borrowings as repaid/unpaid
- Timeline tracking for all borrowings

### User Experience
- Responsive design (mobile-friendly)
- Real-time data updates
- Toast notifications for user feedback
- Loading states and error handling
- Empty state illustrations
- Confirm dialogs for destructive actions

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Fast build tool and development server  
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Recharts** - Charts and data visualization
- **Axios** - HTTP client
- **Heroicons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **express-validator** - Request validation middleware
- **CORS** - Cross-origin resource sharing

## 🏁 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "budget management"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   
   Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. **Database Setup**
   
   Seed the database with sample data:
   ```bash
   cd backend
   npm run seed
   ```

5. **Start the Application**
   
   Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   
   In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Demo Account
After running the seed script, you can use:
- **Email**: john.doe@example.com
- **Password**: password123

## 📁 Project Structure

```
budget management/
├── backend/
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── Budget.js
│   │   ├── Expense.js
│   │   └── Borrowing.js
│   ├── routes/           # Express routes
│   │   ├── auth.js
│   │   ├── budgets.js
│   │   ├── expenses.js
│   │   └── borrowings.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   ├── scripts/          # Utility scripts
│   │   └── seed.js
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable components
    │   │   ├── ui/        # UI components
    │   │   └── layout/    # Layout components
    │   ├── pages/         # Page components
    │   ├── context/       # React context
    │   ├── services/      # API services
    │   ├── App.jsx        # Main app component
    │   └── main.jsx       # Entry point
    ├── package.json
    └── .env.example
```

## 🔧 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Frontend  
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌟 Key Features

### Dashboard
- Overview of all monthly budgets
- Quick stats (total income, active budgets, etc.)
- Easy budget creation with modal forms
- Responsive grid layout for budget cards

### Budget Detail Page
- Monthly income, expenses, and borrowing summary
- Interactive expense and borrowing management
- Visual expense breakdown with pie charts
- Real-time calculations (remaining budget, etc.)
- In-line editing and deletion of items

### Data Models

**User**
- Name, email (unique), password hash
- Automatic password hashing with bcrypt

**Budget** 
- Linked to user, year, and month (unique constraint)
- Income amount with validation

**Expense**
- Linked to user and budget
- Name, category, amount, date, optional notes
- Predefined categories for consistency

**Borrowing**
- Linked to user and budget  
- Lender name, amount, date, optional notes
- Repayment status tracking

### Security Features
- JWT token authentication
- Password strength requirements
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Secure HTTP headers

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Budgets
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get budget by ID
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/:id/summary` - Get budget summary

### Expenses
- `GET /api/expenses` - Get expenses (with filtering)
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Borrowings
- `GET /api/borrowings` - Get borrowings (with filtering)  
- `POST /api/borrowings` - Create borrowing
- `PUT /api/borrowings/:id` - Update borrowing
- `DELETE /api/borrowings/:id` - Delete borrowing
- `PUT /api/borrowings/:id/repay` - Mark as repaid

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: Clean forms for data entry
- **Empty States**: Helpful guidance when no data exists
- **Confirmation Dialogs**: Prevent accidental deletions
- **Visual Charts**: Pie charts for expense breakdowns
- **Consistent Styling**: Tailwind CSS utility classes
- **Accessibility**: Semantic HTML and keyboard navigation

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use a process manager like PM2
3. Set up MongoDB Atlas or cloud MongoDB
4. Configure CORS for production domain

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to hosting service
3. Set up environment variables for production API URL

### Recommended Hosting
- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check if MongoDB is running locally
- Verify the connection string in `.env`
- Check firewall settings

**Frontend API Calls Failing**
- Verify backend server is running on port 5000
- Check CORS configuration
- Ensure frontend `.env` has correct API URL

**Authentication Issues**
- Clear browser localStorage
- Check JWT token expiration
- Verify JWT_SECRET matches between requests

### Development Tips

1. Use browser DevTools to inspect API calls
2. Check browser console for JavaScript errors
3. Monitor backend logs for server errors
4. Use MongoDB Compass to inspect database data
5. Test API endpoints with tools like Postman or Insomnia

```markdown

For more help, please open an issue in the repository.
=======
# Budget-Management-System
>>>>>>> fcb041baf263600ea84913d1a5dd18d519dc45e8
