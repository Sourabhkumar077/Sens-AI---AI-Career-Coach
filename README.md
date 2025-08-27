# Sens-AI: An AI-Powered Career Coach

![Sens-AI Banner](./public/banner.jpeg)

## About This Project

This is a project I'm building as part of my learning journey. I am creating this by following tutorials and expanding its features with my own skills and knowledge. This project is not open source and is intended for personal development and demonstration purposes only.

Sens-AI is a full-stack web application designed to be a personal AI career coach. It helps users navigate their career paths by providing AI-driven tools for resume building, cover letter generation, and interview preparation, along with valuable industry insights.

## Core Features

* **🤖 AI-Powered Industry Insights**: A dynamic dashboard that provides real-time data on salary ranges, market trends, and in-demand skills for the user's specific industry.
* **📄 Smart Resume Builder**: An interactive resume builder with a markdown editor and an AI-powered feature to improve and optimize resume content for Applicant Tracking Systems (ATS).
* **✉️ AI Cover Letter Generator**: Automatically generates personalized and professional cover letters based on user profiles and job descriptions.
* **🎙️ Interview Preparation**: Users can practice for technical interviews with AI-generated quizzes tailored to their industry and skill set, complete with performance tracking and feedback.
* **👤 Personalized Onboarding**: A streamlined onboarding process to capture user details and tailor the application's features to their career goals.

## Tech Stack

* **Framework**: Next.js (App Router)
* **Database**: PostgreSQL with Prisma ORM
* **Authentication**: Clerk
* **AI**: Google Generative AI (Gemini)
* **Styling**: Tailwind CSS & shadcn/ui
* **Background Jobs**: Inngest
* **Form Management**: React Hook Form with Zod for validation
* **UI Components**: Radix UI, Recharts, Lucide React

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18.17.0 or later)
* npm, yarn, or pnpm
* A PostgreSQL database

### Installation & Setup

1.  Clone the repository (if you have access):
    ```sh
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```sh
    cd sens-ai-career-coach
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```
4.  Set up your environment variables by creating a `.env` file in the root of the project. Add the following variables:

    ```env
    # Database Connection
    DATABASE_URL="your_postgresql_connection_string"

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key

    # Clerk URLs
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

    # Google Generative AI API Key
    GEMINI_API_KEY=your_gemini_api_key
    ```

5.  Push the database schema to your database:
    ```sh
    npx prisma db push
    ```

6.  Run the development server:
    ```sh
    npm run dev
    ```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## Disclaimer

This is a personal project created for learning and demonstration purposes. It is not intended for production use or open-source contribution.