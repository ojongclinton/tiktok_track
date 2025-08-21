// src/appwrite.js
import { Client, Account, OAuthProvider } from 'appwrite'

const client = new Client()
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')// The Appwrite API endpoint
  .setProject('68a613ec0030e36f4f46')// Your Appwrite project ID
export { OAuthProvider }
export const account = new Account(client)

