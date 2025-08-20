# order

order is a tool to help with generating ecs order forms for comet robotics projects. currently work in progress

## usage

to run desktop app, ensure you have node.js installed and yarn installed, then follow these steps:

- clone repo
- run `yarn`
- run `yarn dev` to start the desktop app

## dev notes

### todos
- [x] make desktop app w tauri or web app that downloads the order forms in one click with given data
- [ ] make ui less ugly / annoying to use. pasted data doesn't need to always be displayed. table is waste of space, should be more spreadsheet like / more dense
- [ ] add drop down for selecting project, multiline text input writing justification
- [ ] implement manual price verification and student signing workflow
    - can use https://graphql.canopyapi.co to auto verify amazon prices (most common site we order from)
    - if possible make it force me to check with PMs to verify the link has the correct variant selected / verify it matches with the title. this has caused sad times in the past so i should do this
- [ ] implement .eml generator (https://www.npmjs.com/package/eml-format) that has the email prefilled and forms attached so i can hit send quickly
- [ ] use github actions + releases + some update server to deliver updates to ppl
- [ ] posthog maybe 


## app screens
- set up signature + contact info screen
- project order items selection screen
- selected items - price verification screen 
