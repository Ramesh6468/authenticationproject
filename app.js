const express = require("express");

const bcrypt = require("bcrypt");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();

app.use(express.json());

let db = null;

const dbpath = path.join(__dirname, "userData.db");

const initialiseserveranddb = async () => {
  try {
    db = await open({
      filename: dbpath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log(`Server running`);
    });
  } catch (e) {
    console.log(`Error ${e.message}`);
  }
};

initialiseserveranddb();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `

      INSERT INTO 

        user (username, name, password, gender, location) 

      VALUES 

        (

          '${username}', 

          '${name}',

          '${hashedPassword}', 

          '${gender}',

          '${location}'

        );`;

    if (password.length < 5) {
      response.status(400);

      response.send("Password is too short");
    } else {
      const dbResponse = await db.run(createUserQuery);

      const newUserId = dbResponse.lastID;

      response.send("User created successfully");
    }
  } else {
    response.status(400);

    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectedUser = `SELECT * FROM user WHERE username = '${username}'`;

  const dbuser2 = await db.get(selectedUser);

  if (dbuser2 === undefined) {
    response.status(400);

    response.send("Invalid user");
  } else {
    const password2 = await bcrypt.compare(password, dbuser2.password);

    if (password2 === true) {
      response.status(200);

      response.send("Login success!");
    } else {
      response.status(400);

      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectedUser2 = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser3 = await db.get(selectedUser2);

  if (dbUser3 === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const validPassword = await bcrypt.compare(oldPassword, dbUser3.password);
    if (validPassword === true) {
      const length = newPassword.length;
      if (length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encrypt = await bcrypt.hash(newPassword, 10);
        const updatePassword = `UPDATE user
        SET password = '${encrypt}'
        `;
        await db.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
