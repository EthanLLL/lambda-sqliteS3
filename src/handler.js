import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFileSync, readFileSync } from 'fs'
import Database from 'better-sqlite3'

const bucket = 's3-as-db-1'
const dbName = 'user_1.db'
const key = `sqlite3/user_1/${dbName}`
const dbPath = `${process.env.DB_BASE_DIR}/${dbName}`
const client = new S3Client({})

async function prepareDb() {
  const input = {
    Bucket: bucket,
    Key: key
  }
  const command = new GetObjectCommand(input)
  const res = await client.send(command)
  const data = await res.Body.transformToByteArray()
  writeFileSync(dbPath, data)
  const db = new Database(dbPath, {})
  return db
}

async function uploadDB() {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: readFileSync(dbPath)
  })
  await client.send(command)
}

process.on('SIGTERM', async () => {
  console.info('[runtime] SIGTERM received');

  // perform actual clean up work here. 
  await uploadDB()
  console.info('Uploaded db.')
  console.info('[runtime] exiting');
  process.exit(0)
});

const db = await prepareDb()

export const handler = async (event) => {
  console.log(event)
  const stmt = db.prepare('insert into message (message) values (?)')
  stmt.run('New message')
  // TODO implement

  const sql = 'select * from message'
  const messages = db.prepare(sql).all()

  const response = {
    statusCode: 200,
    body: JSON.stringify(messages),
  };
  return response;
};

