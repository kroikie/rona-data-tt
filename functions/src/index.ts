import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const updates = functions.https.onRequest((request, response) => {
  const from = Number(request.query['from']);
  const to = Number(request.query['to']);

  let updateQuery: admin.firestore.Query = admin.firestore()
      .collection('moh_updates');

  if (from) {
   updateQuery = updateQuery.where('timestamp', '>=', from);
  }

  if (to) {
   updateQuery = updateQuery.where('timestamp', '<=', to);
  }

  return updateQuery.get()
      .then((querySnapshot) => {
        const updateArray = [];
        for (let documentSnapshot of querySnapshot.docs) {
          updateArray.push(documentSnapshot.data());
        }
        response.send(updateArray);
      });
});
