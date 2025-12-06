import triggerService from './triggerService.js';



export default async function () {

  return await triggerService._process(Date.now() + 59 * 1000);

}