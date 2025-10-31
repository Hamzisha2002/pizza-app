#!/bin/bash

# Boss Pizza Mobile - Quick Deployment Script
# Usage: ./deploy.sh [preview|production|apk]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍕 Boss Pizza Mobile - Deployment Script${NC}"
echo ""

# Check if logged in
echo -e "${YELLOW}Checking Expo login status...${NC}"
if ! npx expo whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Not logged in to Expo${NC}"
    echo -e "${YELLOW}Please login first:${NC}"
    echo "  npx expo login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in as: $(npx expo whoami)${NC}"
echo ""

# Get deployment type from argument
DEPLOY_TYPE=${1:-preview}

case $DEPLOY_TYPE in
    preview)
        echo -e "${BLUE}📤 Publishing preview update to Expo cloud...${NC}"
        npx eas update --branch preview --message "Preview update: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        echo -e "${GREEN}✅ Preview published successfully!${NC}"
        echo -e "${YELLOW}📱 To test, run: npx expo start --tunnel${NC}"
        ;;
    
    production)
        echo -e "${BLUE}📤 Publishing production update to Expo cloud...${NC}"
        npx eas update --branch production --message "Production update: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        echo -e "${GREEN}✅ Production published successfully!${NC}"
        ;;
    
    apk)
        echo -e "${BLUE}🔨 Building preview APK...${NC}"
        echo -e "${YELLOW}This will take 5-15 minutes...${NC}"
        npx eas build --profile preview --platform android
        echo ""
        echo -e "${GREEN}✅ APK build started!${NC}"
        echo -e "${YELLOW}Monitor progress at: https://expo.dev${NC}"
        ;;
    
    development)
        echo -e "${BLUE}🔨 Building development APK...${NC}"
        echo -e "${YELLOW}This will take 5-15 minutes...${NC}"
        npx eas build --profile development --platform android
        echo ""
        echo -e "${GREEN}✅ Development build started!${NC}"
        echo -e "${YELLOW}Monitor progress at: https://expo.dev${NC}"
        ;;
    
    *)
        echo -e "${RED}❌ Invalid deployment type: $DEPLOY_TYPE${NC}"
        echo ""
        echo "Usage: ./deploy.sh [preview|production|apk|development]"
        echo ""
        echo "Options:"
        echo "  preview      - Publish update to preview channel (default)"
        echo "  production   - Publish update to production channel"
        echo "  apk          - Build installable APK for Android"
        echo "  development  - Build development APK with debug features"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"

