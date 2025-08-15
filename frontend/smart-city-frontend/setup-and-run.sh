# Smart City Control Center - Setup and Run Script
# This script sets up and runs the React smart city dashboard locally

set -e  # Exit on any error

echo "🏙️  Smart City Control Center Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Node.js is installed
print_header "Checking Prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_status "Please install Node.js from https://nodejs.org/"
    print_status "Recommended version: Node.js 16 or higher"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Create project directory
PROJECT_NAME="smart-city-control-center"
print_header "Setting up project directory..."

if [ -d "$PROJECT_NAME" ]; then
    print_warning "Directory $PROJECT_NAME already exists!"
    read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_NAME"
        print_status "Removed existing directory"
    else
        print_status "Using existing directory"
        cd "$PROJECT_NAME"
    fi
else
    mkdir "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    print_status "Created project directory: $PROJECT_NAME"
fi

# Initialize React app if package.json doesn't exist
if [ ! -f "package.json" ]; then
    print_header "Initializing React application..."
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "smart-city-control-center",
  "version": "1.0.0",
  "description": "Smart City Control Center - React Dashboard",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "three": "^0.158.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.294.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

    print_status "Created package.json"
fi

# Create directory structure
print_header "Creating project structure..."
mkdir -p public src/components src/contexts

# Create public/index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Smart City Control Center Dashboard" />
    <title>Smart City Control Center</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

print_status "Created public/index.html"

# Install dependencies
print_header "Installing dependencies..."
print_status "This may take a few minutes..."

npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies!"
    exit 1
fi

# Create environment file
print_header "Setting up environment..."
cat > .env << 'EOF'
# Smart City Control Center Environment Variables
REACT_APP_API_URL=http://localhost:8000
GENERATE_SOURCEMAP=false
EOF

print_status "Created .env file"
print_warning "You can modify REACT_APP_API_URL in .env to point to your backend server"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

print_status "Created .gitignore"

# Success message
print_header "Setup Complete! 🎉"
echo
print_status "Smart City Control Center is ready to run!"
echo
print_status "The application includes:"
echo "  • 3D Interactive City Map with Three.js"
echo "  • Real-time Dashboard with Charts"
echo "  • Automation Rules Management"
echo "  • AI-powered Scenario Testing"
echo "  • Mock data with real-time updates"
echo
print_header "Starting the development server..."
print_status "The app will open in your browser at http://localhost:3000"
echo
print_warning "Note: The app uses mock data by default."
print_warning "Set REACT_APP_API_URL in .env to connect to your backend."
echo

# Start the development server
npm start
EOF
