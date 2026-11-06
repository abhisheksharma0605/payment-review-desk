# Payment Review Desk

**Project by Abhishek Sharma** · Interactive business analysis project

[Open live demo](https://abhisheksharma0605.github.io/payment-review-desk/) · [Test evidence](evidence/test-results.json)

A payment operations analyst needs a consistent way to review exceptions without losing decisions in a spreadsheet. This app validates a CSV, highlights possible duplicates and pending/failed records, and captures human decisions.

The synthetic sample has 12 payments: 6 flagged records, including 4 duplicate candidates, 1 pending and 1 failed. Flags do not prove duplicate settlement or financial loss.

## Rules and decisions

| Rule | Behavior |
|---|---|
| Repeated reference | Paid records with the same normalized reference and currency are candidates |
| Similar payment | Same payee, amount and currency within two calendar days |
| Pending or failed | Record enters the attention queue |
| Review | A recorded decision requires a note |
| Progress | Flagged records with decisions / all flagged records; not resolution |

This demonstrates business rules, data validation, exception analysis, workflow design and boundary testing. No bank connection, money movement, fraud model, regulatory compliance claim or employer materials are included. Matching can produce false positives.

## Technology

HTML, CSS and JavaScript. Runs in the browser with local storage. Hosted on GitHub Pages. Automated checks use Node.js.

## Provenance

Personal portfolio project developed with AI coding assistance. All sample data is synthetic. No employer code, proprietary FIS materials or client documents are included. This prototype does not claim production use or measured business savings.
