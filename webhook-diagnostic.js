#!/usr/bin/env node

console.log('🔍 SHOPIFY WEBHOOK DIAGNOSTIC TOOL');
console.log('=' .repeat(50));

// Check 1: Development server status
console.log('\n1️⃣ CHECKING DEVELOPMENT SERVER STATUS...');

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function checkProcesses() {
  try {
    const { stdout } = await execAsync('Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object ProcessName,Id', { shell: 'powershell.exe' });
    console.log('✅ Node processes running:');
    console.log(stdout);
  } catch (error) {
    console.log('❌ Could not check processes:', error.message);
  }
}

// Check 2: Shopify app configuration
console.log('\n2️⃣ CHECKING SHOPIFY APP CONFIGURATION...');

function checkShopifyConfig() {
  const configPath = './shopify.app.toml';
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    
    // Extract application URL
    const urlMatch = config.match(/application_url = "([^"]+)"/);
    if (urlMatch) {
      console.log('✅ Application URL:', urlMatch[1]);
    }
    
    // Check webhook subscriptions
    const webhookMatches = config.match(/topics = \[ "([^"]+)" \]/g);
    if (webhookMatches) {
      console.log('✅ Webhook subscriptions found:');
      webhookMatches.forEach(match => {
        const topic = match.match(/"([^"]+)"/)[1];
        console.log(`   - ${topic}`);
      });
    }
  } else {
    console.log('❌ shopify.app.toml not found');
  }
}

// Check 3: Webhook endpoint files
console.log('\n3️⃣ CHECKING WEBHOOK ENDPOINT FILES...');

function checkWebhookFiles() {
  const webhookFiles = [
    './app/routes/webhooks.orders.create.jsx',
    './app/routes/webhooks.orders.paid.jsx'
  ];
  
  webhookFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
}

// Check 4: Recent webhook logs
console.log('\n4️⃣ CHECKING RECENT WEBHOOK ACTIVITY...');

function checkWebhookLogs() {
  const logDir = './webhook-logs';
  const logFile = path.join(logDir, 'webhook-activity.log');
  
  if (fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-5);
    console.log('✅ Recent webhook activity:');
    logs.forEach(log => console.log(`   ${log}`));
  } else {
    console.log('❌ No webhook activity logs found');
    console.log('💡 This means webhooks haven\'t been received yet');
  }
}

// Check 5: Database connectivity
console.log('\n5️⃣ CHECKING DATABASE CONNECTIVITY...');

import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const orderCount = await prisma.order.count();
    console.log(`✅ Database connected - ${orderCount} orders found`);
    
    const realOrders = await prisma.order.count({
      where: {
        shopifyOrderId: {
          not: {
            startsWith: 'test-'
          }
        }
      }
    });
    console.log(`📊 Real Shopify orders: ${realOrders}`);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run all checks
async function runDiagnostics() {
  await checkProcesses();
  checkShopifyConfig();
  checkWebhookFiles();
  checkWebhookLogs();
  await checkDatabase();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Make sure your Shopify app is running: npm run dev');
  console.log('2. Install/reinstall your app in the Shopify development store');
  console.log('3. Create a test order in your Shopify store');
  console.log('4. Watch the console for webhook logs');
  console.log('5. Run this diagnostic again to see webhook activity');
}

runDiagnostics();
