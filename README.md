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
![server starting page](./screenshots/createprocess.jpg)
- Allow the user to choose the five other users from a dropdown list and send email notifications to each user when a new process is created.
![server starting page](./screenshots/dropdown.jpg)
- Add the functionality for users to add comments and upload a mandatory picture during the sign-off process.
![server starting page](./screenshots/needsignof.jpg)
- Allow the process creator to select which users can see the comments.
### this can be seen in first screenshot, while creating porocess user will have option to hide comment or make them visible

- Ensure the process creator receives a notification on their page when anyone signs off, and notify all parties involved via email when everyone
signs off.

- The same Postgres db can be used for this process as well.