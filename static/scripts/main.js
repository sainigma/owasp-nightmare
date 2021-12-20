let cmdContainer
let userinput
let token

const getToken = () => {
  const results = document.getElementsByName('csrfmiddlewaretoken')
  token = results[0].value
}

const submitForm = (target, data, next) => {
  let urlEncodedData = "", urlEncodedDataPairs = [], name
  for(name in data) {
    urlEncodedDataPairs.push( encodeURIComponent( name ) + '=' + encodeURIComponent( data[name] ) );
  }
  urlEncodedData = urlEncodedDataPairs.join( '&' ).replace( /%20/g, '+' );

  let http = new XMLHttpRequest();
  http.addEventListener('load', function(event) {
    next(event.target.response)
  })
  http.open('POST', target)
  http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  http.send(urlEncodedData)
}

const log = (argv) => {
  const args = Array.isArray(argv) ? argv : [argv]
  args.forEach(arg => {
    let p = document.createElement('p')
    p.innerHTML = arg
    cmdContainer.append(p)
  })
  cmdContainer.scrollTo(0,cmdContainer.scrollHeight);
}

const createUser = (argv) => {
  const parseUserCreation = (response) => {
    const data = JSON.parse(response)
    if (data['success']) {
      log('User created!')
      return
    } else {
      log('Username already exists!')
    }
  }
  if (argv.length !== 3) {
    log('error')
    return
  }
  const data = {
    'username': argv[1],
    'password': argv[2],
    'csrfmiddlewaretoken': token
  }
  submitForm('/new', data, parseUserCreation)
}

const login = (argv) => {
  const parseLogin = (response) => {
    const data = JSON.parse(response)
    if (data['success']) {
      log('Logged in')
      setTitle(data['username'])
      return
    } else {
      if (data['error'] == 'username') {
        log('Invalid username')
      } else {
        log('Invalid password')
      }
    }
  }
  if (argv.length !== 3) {
    log('Invalid arguments')
    return
  }
  const data = {
    'username': argv[1],
    'password': argv[2],
    'csrfmiddlewaretoken': token
  }
  submitForm('/login', data, parseLogin)
}

const logout = (argv) => {
  const parseLogout = (response) => {
    const data = JSON.parse(response)
    if (data['success']) {
      clear([])
      log('Logged out')
      setTitle('INPUT')
    } else {
      log('Not logged in!')
      setTitle('INPUT')
    }
  }
  const data = {
    'csrfmiddlewaretoken': token
  }
  submitForm('/logout', data, parseLogout)
}

const get = (argv) => {
  const parseGet = (response) => {
    const data = JSON.parse(response)
    if (data['success']) {
      clear([])
      const messages = data['messages'].reverse()
      if (messages.length == 0) {
        log('No messages')
      }
      messages.forEach(message => {
        log(`${message[2]} [<span class='whitespan'>${message[0]}->${message[3]}</span>]: ${message[1]}`)
      })
    } else {
      logout()
    }
  }
  const data = {
    'csrfmiddlewaretoken': token
  }
  submitForm('/get', data, parseGet)
}

const send = (argv) => {
  const parseSend = (response) => {
    const data = JSON.parse(response)
    if (data['success']) {
      get()
    } else {
      log('error')
    }
  }
  if (argv.length < 3) {
    log('Invalid arguments')
    return
  }
  const target = argv[1]
  argv.shift()
  argv.shift()
  const message = argv.join(' ')
  const data = {
    'target': target,
    'msg': message,
    'csrfmiddlewaretoken': token
  }
  submitForm('/send', data, parseSend)
}

const help = (argv) => {
  log('Available commands:')
  const actionIt = actions.keys()
  while (true) {
    const value = actionIt.next().value
    if (value) {
      log('&nbsp;&nbsp;'+value)
    } else {
      break
    }
  }
}

const clear = (argv) => {
  cmdContainer.innerHTML = ''
}

const actions = new Map([
  ['new', createUser],
  ['login', login],
  ['logout', logout],
  ['get', get],
  ['send', send],
  ['clear', clear],
  ['help', help]
])

const cmdParser = (cmd) => {
  const argv = cmd.split(' ')
  if (actions.has(argv[0])) {
    actions.get(argv[0])(argv)
  } else {
    log('Error: command `'+argv[0]+'` not found!')
  }
}

const setTitle = (title) => {
  document.getElementById('inputtitle').innerHTML = title+':'
}

const init = () => {
  getToken()
  cmdContainer = document.getElementById('cmdcontainer')
  userinput = document.getElementById('userinput')
  userinput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      cmdParser(userinput.value)
      userinput.value = ''
    }
  })
  userinput.addEventListener("blur", ()=>{
    setTimeout(function() {
      userinput.focus()
    }, 10)
  })
  userinput.focus()
  userinput.select()

  const welcomeMessage = cmdContainer.children[0].innerHTML
  if (welcomeMessage.includes('Welcome back')) {
    const user = welcomeMessage.substring(14,welcomeMessage.length -1)
    setTitle(user)
  }

}

init()