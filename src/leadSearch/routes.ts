import { Router } from 'express';
import { getData,storeCookies } from './controller';
import { checkSubscriptionAndLimit } from '../middleware/auth.middleware';

const leadSeatchRouter = Router();

// api call for downloading and storing the data from chrome extension
leadSeatchRouter.get('/get-data',checkSubscriptionAndLimit, getData);

// api call for storing the cookie from chrome extension
leadSeatchRouter.get('/set-cookies', storeCookies);





export default leadSeatchRouter;
