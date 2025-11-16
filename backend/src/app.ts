
import express,{Application} from "express"
import helmet from "helmet"
import cors from "cors"

const app:Application = express()

app.use(cors())
app.use(helmet())



app.get("/",(_req,res)=>{
   return  res.json({message:"🎉App is running fine"})
})


export default app
