#!/bin/bash

# Installation Script for Clerk Authentication
# Run this from the cvlyze-app root directory

echo -e "\033[0;36mInstalling Clerk Authentication packages...\033[0m"
echo ""

# Install client dependencies
echo -e "\033[0;33mInstalling client dependencies...\033[0m"
cd client || exit
npm install @clerk/clerk-react
if [ $? -eq 0 ]; then
    echo -e "\033[0;32m✓ Client dependencies installed successfully\033[0m"
else
    echo -e "\033[0;31m✗ Client installation failed\033[0m"
    exit 1
fi
echo ""

# Install server dependencies
echo -e "\033[0;33mInstalling server dependencies...\033[0m"
cd ../server || exit
npm install @clerk/express
if [ $? -eq 0 ]; then
    echo -e "\033[0;32m✓ Server dependencies installed successfully\033[0m"
else
    echo -e "\033[0;31m✗ Server installation failed\033[0m"
    exit 1
fi
echo ""

cd ..

echo -e "\033[0;32mInstallation complete!\033[0m"
echo ""
echo -e "\033[0;36mNext steps:\033[0m"
echo "1. Go to https://clerk.com/ and create an account"
echo "2. Create a new application and get your API keys"
echo "3. Add your keys to the .env files:"
echo "   - client/.env: REACT_APP_CLERK_PUBLISHABLE_KEY"
echo "   - server/.env: CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY"
echo ""
echo -e "\033[0;33mFor detailed instructions, see CLERK_AUTHENTICATION_SETUP.md\033[0m"
