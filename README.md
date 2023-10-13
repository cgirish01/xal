# Backend Engineering: Multisig Assignment

## part 1. Postgres Database and Login:

- Create a PostgresSQL database to store user information such as name
and email.
- Develop a login system that allows users to sign up and assigns them an
internal login ID.
- Implement a bonus feature to allow users to connect their Metamask
wallet.

When we start our node server we will be greeted by this screen, we will have option to login or signup

![server starting page](./screenshots/serverstartpage.jpg)

This is how login and signup page will look like upon clicking
<!-- ![server starting page](./screenshots/login.jpg) ![server starting page](./screenshots/login.jpg) -->


<div style="display: flex;">
  <img src="./screenshots/login.jpg" alt="Description of Image 1" style="width: 49%; max-width: 500px;"/>
  <img src="./screenshots/signup.jpg" alt="Description of Image 2" style="width: 49%; max-width: 500px;"/>
</div>
 <br>
button which will connet to your metabase wallet

<div style="display: flex;">
  <img src="./screenshots/metaUnconnected.jpg" alt="Description of Image 1" style="width: 49%; max-width: 500px;"/>
  <img src="./screenshots/metaconnected.jpg" alt="Description of Image 2" style="width: 49%; max-width: 500px;"/>
</div>
<br>

#### our database table of users
![server starting page](./screenshots/userdb.jpg)

### A glimps of what whole thing look like 
![server starting page](./screenshots/wholepage.jpg)


## 2. Multisignature Process:

- Develop a multi-signature process where a user can create a process that requires sign-offs from five other users.
![create process](./screenshots/createprocess.jpg)
- Allow the user to choose the five other users from a dropdown list and send email notifications to each user when a new process is created.
![dropdown](./screenshots/dropdown.jpg)
- Add the functionality for users to add comments and upload a mandatory picture during the sign-off process.
![need signof](./screenshots/needsignof.jpg)
- Allow the process creator to select which users can see the comments.
  - this can be seen in first screenshot, while creating porocess user will have option to hide comment or make them visible

- Ensure the process creator receives a notification on their page when anyone signs off, and notify all parties involved via email when everyone
signs off.

![email to all](./screenshots/emailall.jpg)

### when ever someone signs off any process creator will receive such notification, creator will see all unread notifications at time of login, and once he clicks notification will disappear and will be marked as read
![notification](./screenshots/notifi.jpg)



### 3. API:
- Break down the multi-signature process into REST APIs.
- Ensure that the APIs can be integrated into any webpage.

## rest api's are being used for every process, and have been integrated with web page

## some other things those are added.

### user will see all process created by him

![createdbyu](./screenshots/createdbyu.jpg)

### user will aslo be able to see all process signed of by him, as a reference of what he signed
![signedof by user](./screenshots/signedofbyu.jpg)

## Database
 - we are using 4 tables here
 ![database](./screenshots/alldata.jpg)

 - user table will have user data 
 ![server starting page](./screenshots/userdb.jpg)

  - process table will have process data 
 ![server starting page](./screenshots/processdb.jpg)

  - signoff table will have data like process id, userid comment, imagepath, signedof, can see comment  
 ![server starting page](./screenshots/signdb1.jpg)
  ![server starting page](./screenshots/signdb2.jpg)

  - notification table will have data like user id, process id message being sent and read/unread
 ![server starting page](./screenshots/userdb.jpg)

 - whenever user login if status is unread, he will see notification of those messages on his dashboard



## Few imp things 
-  i was using docker postgres here
```
docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

### you will be needing some files/ folders in like, which u can see in .gitignore
  - .env
  - /upload
- .env will look like this
  - DB_USER=
  - DB_HOST=
  - DB_NAME=
  - DB_PASSWORD=
  - DB_PORT=
  - SMTP_HOST=
  - SMTP_PORT=
  - SMTP_USER=
  - SMTP_PASS=
- for emailing i have used this `Ethereal Email` for more `https://ethereal.email/`

 ### And did i mention we even have a logout here(top right) 👉🏻👈🏻

 ![server starting page](./screenshots/signout.jpg)

