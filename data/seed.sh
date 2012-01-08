mongo --version
mongoimport --file fixtures/tiles.json -vvv --db arkhamtriune --collection tiles --upsert --upsertFields name --jsonArray --stopOnError --type json