import { Database } from "bun:sqlite";

const db = new Database('mydb', {create: true});
db.run(`CREATE TABLE IF NOT EXISTS 
users(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    email TEXT, 
    password TEXT
  )`);



interface User {
  id: number,
  name: string,
  email: string,
  password: string,
}

const notFoudResponse = new Response("NOT FOUND",{
  status: 404
})

const server = Bun.serve({
    port: 3000,
    async fetch(req: Request) {
      const url = new URL(req.url);

      if(url.pathname === "/user"){

        if(req.method === "POST"){
          const body = await req.json();

          const hashedPassword = await Bun.password.hash(body.password, "bcrypt");
          //STATEMS, params nomes (parametros nomeados)
          db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", body.name, body.email, hashedPassword)

          return new Response("User created successfully!", {status: 201})

        }
        
        if(req.method === "GET"){
          const users: User[] = db.query("SELECT id, name, email, password FROM users").all() as User[];

          return Response.json({
            users
          })
        }
      }

      if(url.pathname.match(/^\/user\/(\d+)$/)){

        const id = Number(url.pathname.split('/').pop());
        const userDb = db.query("SELECT id, name, email FROM users WHERE id = ?").get(id) as User;

        !userDb ?? notFoudResponse;

        if(req.method === "GET"){

          return Response.json({
            user: userDb
          })
        }

        if(req.method === "DELETE"){
          db.run("DELETE FROM users WHERE id = ?", [id])
          return new Response();
        }

        if(req.method === "PUT") {
          const body = await req.json();

          db.run("UPDATE users set name = ?, email = ? WHERE id = ?", body.name, body.email, id);
          return new Response();
        }
      }

      return notFoudResponse;
    },
  });
  
  console.log(`Listening on http://localhost:${server.port} ...`);
  