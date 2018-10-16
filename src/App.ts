import {config} from 'dotenv'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import {isVerified} from './Verify'

class App {
  public express
  
  constructor () {
    this.express = express()
    config()
    this.registerParsers()
    this.mountRoutes()
  }

  private registerParsers() {
    this.express.use(bodyParser.urlencoded({verify: this.rawBodyBuffer, extended: true }));
    this.express.use(bodyParser.json({ verify: this.rawBodyBuffer }));
  }

  private rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };

  private mountRoutes (): void {
    const router = express.Router()
    router.get('/', (req, res) => {
      res.json({
        message: 'This is taskmaster. In order to assign a task use following syntax: /assignTo task to @user every weekday.'
      })
    })
    router.post('/command', (req, res) => {
      if (isVerified) {
        res.json({
          request: req.rawBody
      })
      } else {
        res.sendStatus(404);
      } 
    })
    this.express.use('/', router)
  }
}

export default new App().express