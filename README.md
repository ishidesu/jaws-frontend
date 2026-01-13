# Jaws Custom - E-commerce Platform

A modern e-commerce platform for custom motorcycle parts and accessories, built with Next.js and FastAPI.

## 🚀 Features

- **User Authentication**: Secure login/register with Supabase Auth
- **Product Catalog**: Browse motorcycle parts with categories and search
- **Shopping Cart**: Add/remove items with real-time stock management
- **Order Management**: Complete checkout flow with order tracking
- **Admin Panel**: Product management and order administration
- **AI Chatbot**: Integrated Dify chatbot for customer support
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service for auth and database

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database via Supabase
- **Basic Auth** - API authentication

### Additional Services
- **Dify** - AI chatbot integration
- **WhatsApp API** - Order notifications

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jaws-custom
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   
   Copy `.env.example` to `.env` and configure:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_DIFY_CHATBOT_TOKEN=your_dify_token
   ```

5. **Run the development servers**
   
   Frontend:
   ```bash
   npm run dev
   ```
   
   Backend:
   ```bash
   cd backend
   python main.py
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── catalog/           # Product catalog
│   ├── checkout/          # Checkout flow
│   ├── profile/           # User profile pages
│   └── ...
├── components/            # Reusable React components
├── contexts/              # React contexts (Auth, etc.)
├── lib/                   # Utility functions and configs
├── backend/               # FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── library/          # File storage
│   └── requirements.txt  # Python dependencies
└── public/               # Static assets
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations (contact admin for schema)
3. Configure Row Level Security (RLS) policies
4. Update environment variables

### Backend Configuration
- Configure basic auth credentials
- Set up file upload directory
- Configure CORS for frontend domain

### Chatbot Integration
- Create Dify chatbot
- Configure user context variables
- Add chatbot token to environment

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Connect repository to deployment platform
2. Configure environment variables
3. Deploy with automatic builds

### Backend (VPS/Cloud)
1. Set up Python environment
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and inquiries, contact the development team.
