const admin = require('firebase-admin')

const serviceAccount = require('./buzzn-credentials.json')

serviceAccount.private_key_id = process.env.FIREBASE_PRIVATE_KEY_ID
serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY.replace(
  /\\n/g,
  '\n'
)

const appConfig = {
  credential: admin.credential.cert(serviceAccount),
}

const firebaseAdminApp = admin.initializeApp(appConfig)

module.exports = firebaseAdminApp // <-- this is the app instance
