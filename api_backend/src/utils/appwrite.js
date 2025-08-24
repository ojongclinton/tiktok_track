import { Client, Account, Storage } from "node-appwrite";

const client = new Client();
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("68a613ec0030e36f4f46");

export const appWriteStorage = new Storage(client);
