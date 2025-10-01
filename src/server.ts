import express from "express"

const PORT = 3333;

const app = express();

app.use(express.json());

app.get("/", (request, response) => {
    return response.json({message: "ok"})
})

app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`)
})