const bcrypt = require('bcryptjs');
const password = 'Omkar@123';
const hash = '$2b$12$gglnb0utpz.wn2nknwTygOCA7IgEnx2r6lb/zUdMrLVXQVG3q1VwW';

bcrypt.compare(password, hash).then(res => {
  console.log('Match:', res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
