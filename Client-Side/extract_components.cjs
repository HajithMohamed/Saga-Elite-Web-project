const fs = require('fs');
const path = require('path');

function extractAndSave(sourceMap) {
  for (const [dest, source] of Object.entries(sourceMap)) {
    try {
      const content = fs.readFileSync(source, 'utf8');
      const match = content.match(/```(?:jsx)?\n([\s\S]*?)```/);
      if (match) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, match[1].trim());
        console.log('Fixed', dest);
      } else {
        console.log('No match found in', source);
      }
    } catch (e) {
      console.log('Error reading/writing', dest, e.message);
    }
  }
}

const resources = {
  'Client-Side/src/components/common-components/MainFooter.jsx': 'C:\\Users\\Admin\\AppData\\Roaming\\Code\\User\\workspaceStorage\\e10f2820dee9e87c6c17990401b853b2\\GitHub.copilot-chat\\chat-session-resources\\4e7b088d-9e1c-45c7-9007-1abcf4fc35e7\\call_MHxKWm5BZlA5cE5BSzdhcTQ2N2Y__vscode-1777989895594\\content.txt',
  'Client-Side/src/components/shopping-components/ProductCard.jsx': 'C:\\Users\\Admin\\AppData\\Roaming\\Code\\User\\workspaceStorage\\e10f2820dee9e87c6c17990401b853b2\\GitHub.copilot-chat\\chat-session-resources\\4e7b088d-9e1c-45c7-9007-1abcf4fc35e7\\call_MHxNbTMwckVob0wxSDBKd3BXRUg__vscode-1777989895605\\content.txt',
  'Client-Side/src/pages/shopping-view/Home.jsx': 'C:\\Users\\Admin\\AppData\\Roaming\\Code\\User\\workspaceStorage\\e10f2820dee9e87c6c17990401b853b2\\GitHub.copilot-chat\\chat-session-resources\\4e7b088d-9e1c-45c7-9007-1abcf4fc35e7\\call_MHxBaDlnNTA1NjY3dUlJT3ZhdUs__vscode-1777989895627\\content.txt'
};

extractAndSave(resources);

