const fsPromises = require('fs/promises');
const newBuffer = require('buffer').Buffer;
const simpleCrypto = require('simple-crypto-js').default;
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getHash() {
  readline.question('Enter a salt: ', (salt) => {
    const simple = new simpleCrypto(salt);
    readline.question('Enter a password: ', async (password) => {
      const hash = simple.encrypt(password);
      console.log(`Your hash is: ${hash}`);
      readline.question('Enter your name: ', async (name) => {
        try {
          const data = new Uint8Array(
            newBuffer.from(
              `DATABASE_URL="file:../db/ezups.db"\nAPI_KEY="${password}"\nAPI_SALT="${salt}"\nNEXT_PUBLIC_API_HASH="${hash}"\nNEXT_PUBLIC_YOURNAME="${name}"\n`
            )
          );
          const promise = fsPromises.writeFile('.env', data);
          await promise;
        } catch (err) {
          console.error(err);
        }
        readline.close();
      });
    });
  });
}

getHash();
