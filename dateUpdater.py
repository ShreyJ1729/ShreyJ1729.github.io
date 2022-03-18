from datetime import datetime

# Read in the file
with open('index.html', 'r') as file:
  filedata = file.read()

date = datetime.now().strftime("%B %d, %Y")

# Replace the target string
filedata = filedata.replace('<li>Website last updated: </li>', '<li>Website last updated: ' + date + '</li>')

# Write the file out again
with open('index.html', 'w') as file:
  file.write(filedata)