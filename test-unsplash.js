// This script directly tests the Unsplash API by making HTTP requests
// without requiring the Next.js project's TypeScript modules

// Set up environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Get the access key from environment variables
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

console.log('Testing Unsplash API integration...');
console.log('Using access key:', UNSPLASH_ACCESS_KEY);

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY is not set in .env.local');
  process.exit(1);
}

// Function to make an HTTP request to the Unsplash API
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test the Unsplash API by fetching a random photo
async function testUnsplashApi() {
  try {
    console.log('Fetching a random photo from Unsplash...');

    const options = {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    };

    const photo = await makeRequest('https://api.unsplash.com/photos/random', options);

    console.log('Successfully fetched random photo from Unsplash!');
    console.log('Photo details:');
    console.log(`- ID: ${photo.id}`);
    console.log(`- Description: ${photo.description || 'No description'}`);
    console.log(`- Photographer: ${photo.user.name}`);
    console.log(`- URL: ${photo.urls.regular}`);

    return true;
  } catch (error) {
    console.error('Error fetching random photo from Unsplash:', error.message);
    if (error.message.includes('OAuth error') || error.message.includes('invalid')) {
      console.error('\nThe access token appears to be invalid. Please check your .env.local file.');
      console.error('Make sure the UNSPLASH_ACCESS_KEY is set correctly with the leading hyphen.');
      console.error('Current value:', UNSPLASH_ACCESS_KEY);
    }
    return false;
  }
}

// Run the test
testUnsplashApi()
  .then(success => {
    if (success) {
      console.log('\nTest completed successfully! The access key is working correctly.');
    } else {
      console.log('\nTest failed. Please check the error messages above.');
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
  });
