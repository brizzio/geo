let opassquery = `
  [out:json][timeout:300];
  area["name"="Brazil"]->.searchArea;
  (
    node["shop"](area.searchArea);
    way["shop"](area.searchArea);
    relation["shop"](area.searchArea);
  );
  out tags;
`

  const data = /* paste the JSON result here */;
  const shopTypes = new Set();

  data.elements.forEach(element => {
    if (element.tags && element.tags.shop) {
      shopTypes.add(element.tags.shop);
    }
  });

  console.log(Array.from(shopTypes));
