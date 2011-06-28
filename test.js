a={
  "email": "rahuldave@gmail.com",
  "cookie": "4df7ce0d06",
  "openurl_srv": "",
  "openurl_icon": "",
  "loggedin": "0",
  "myadsid": "327151620",
  "lastname": "Dave",
  "firstname": "Rahul"
};
c=JSON.stringify(a);
console.log(a);
b=JSON.parse(c);
console.log(b['email']);
