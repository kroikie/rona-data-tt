PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n';
PRIVATE_EMAIL = '<email-address>@<project-id>.iam.gserviceaccount.com';

function main() {
  var currentUpdates = getCurrentUpdates();
  var rows = getRows();

  for (var i in rows) {
    var row = rows[i];
    var time = getRowTime(row);
    writeRowToDatabase(time, row);
  }
}

function writeRowToDatabase(id, data) {
  var document = {
    'fields': {
      'timestamp': {
        'integerValue': id
      },
      'link': {
        'stringValue': data[1]
      },
      'samples': {
        'integerValue': data[2]
      },
      'positive': {
        'integerValue': data[3]
      },
      'deaths': {
        'integerValue': data[4]
      },
      'discharged': {
        'integerValue': data[5]
      },
      'hospitalized': {
        'integerValue': data[6]
      },
    }
  };

  var service = getFirebaseService();
  var accessToken = service.getAccessToken();

  var response = UrlFetchApp.fetch('https://firestore.googleapis.com/v1beta1/projects/rona-data-tt/databases/(default)/documents/moh_updates/' + id, {
    'method': 'patch',
    'headers': {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(document)
  });
}

function isNewTime(updates, time) {
  for (var i in updates) {
    if (getUpdateId(updates[i]) == time) {
      return false;
    }
  }
  return true;
}

function getUpdateId(update) {
  var id = update['name'];
  id = id.substring(id.lastIndexOf('/') + 1);
  return id;
}

function getRowTime(row) {
  var dateArr = row[0].split('/');
  return new Date(dateArr[2], dateArr[0] - 1, dateArr[1]).getTime() + '';
}

function getRows() {
  var sheetId = '10rHXosQ3onQkXjatrdBP3HchyKaFAXqjBwQCwu8BzNo';
  var rows = Sheets.Spreadsheets.Values.get(sheetId, 'MOH Data!A2:I').values;
  return rows;
}

function getCurrentUpdates() {
  var service = getFirebaseService();
  var accessToken = service.getAccessToken();

  var response = UrlFetchApp.fetch('https://firestore.googleapis.com/v1beta1/projects/rona-data-tt/databases/(default)/documents/moh_updates', {
    'headers': {
      'Authorization': 'Bearer ' + accessToken
    }
  });
  var respJson = JSON.parse(response.getContentText());
  var updates = respJson['documents'];

  while (respJson['nextPageToken']) {
    response = UrlFetchApp.fetch('https://firestore.googleapis.com/v1beta1/projects/rona-data-tt/databases/(default)/documents/moh_updates?pageToken=' + respJson['nextPageToken'], {
      'headers': {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    respJson = JSON.parse(response.getContentText());
    updates = updates.concat(respJson['documents']);
  }

  return updates;
}

function getFirebaseService() {
  return OAuth2.createService('Firebase')
      // Set the endpoint URL.
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(PRIVATE_EMAIL)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scopes.
      .setScope('https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore');
}
