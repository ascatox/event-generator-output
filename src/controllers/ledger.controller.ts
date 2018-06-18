// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import { LedgerClient } from 'node-ledger-client';
import { logger } from "../Logger";
import { ConveyorBay } from '../model/ConveyorBay';
import { ConveyorItemType } from '../model/ConveyorItemType';
import { ConveyorItem } from '../model/ConveyorItem';
const fabricConfig = require('../../resources/config-fabric-network.json');

// Assign router to the express.Router() instance
const router: Router = Router();
var ledgerClient;
// The / here corresponds to the route that the LedgerController
// is mounted on in the server.ts file.
// In this case it's /ledger
router.get('/', (req: Request, res: Response) => {
    // Reply with a hello world when no name param is provided
    res.send('Hello, World!');
});

router.get('/:name', (req: Request, res: Response) => {
    // Extract the name from the request parameters
    let { name } = req.params;
    // Greet the given name
    res.send(`Hello, ${name}`);
});


router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json())

router.post('/editConveyorBay', (req, res) => { 
    console.log("editConveyorBay");
    const body: string = req.body;
    console.log("body="+JSON.stringify(body));
    const ledger = async () => {
        ledgerClient = await LedgerClient.init(fabricConfig); 
        editConveyorBay(JSON.stringify(body)).then(data => {
            console.log("success editConveyorBay");
            res.json(data);
        }, error => {
            logger.error(error.message);
            res.status(error.staus || 500).send(error.message);
        });
    };
    ledger();
});



router.get('/getItemsByBay/:id', (req: Request, res: Response) => {
    // Reply with a hello world when no name param is provided
    let { id } = req.params;
    // Greet the given name
    console.log("getItemsByBay for bay id="+id);
    const ledger = async () => {
        ledgerClient = await LedgerClient.init(fabricConfig); 
        getItemsByBay(id).then(data => {
            console.log("success getItemsByBay");
            res.json(data);
        }, error => {
            logger.error(error.message);
            res.status(error.staus || 500).send(error.message);
        });
    };
    ledger();

});




async function editConveyorBay(json: string) {
    try {
          return await ledgerClient.doInvoke('editConveyorBay', [json]);
        } catch (err) {
          throw new Error(err);
        }
}

async function getItemsByBay(bayId: string) {
    try {
          return await ledgerClient.doInvoke('getItemsByBay', bayId);
        } catch (err) {
          throw new Error(err);
        }
}



// Export the express.Router() instance to be used by server.ts
export const LedgerController: Router = router;