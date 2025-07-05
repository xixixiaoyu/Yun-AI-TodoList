const http = require('http')

const options = {
  host: '0.0.0.0',
  port: process.env.PORT || 3000,
  path: '/api/v1/health',
  timeout: 5000,
  method: 'GET',
  headers: {
    'User-Agent': 'Render-HealthCheck/1.0',
  },
}

console.log(`🔍 Health check starting on ${options.host}:${options.port}${options.path}`)

const request = http.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log(`📊 Health check status: ${res.statusCode}`)

    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data)
        console.log(`✅ Health check passed: ${response.message || 'OK'}`)
        if (response.database) {
          console.log(`📊 Database status: ${response.database.status}`)
        }
      } catch (e) {
        console.log('✅ Health check passed (non-JSON response)')
      }
      process.exit(0)
    } else {
      console.log(`❌ Health check failed with status ${res.statusCode}`)
      console.log(`📋 Response: ${data}`)
      process.exit(1)
    }
  })
})

request.on('error', (err) => {
  console.log('❌ Health check failed:', err.message)
  console.log('🔧 This might indicate the application is not running or not accessible')
  process.exit(1)
})

request.on('timeout', () => {
  console.log('⏰ Health check timeout')
  console.log('🔧 This might indicate the application is slow to respond')
  request.destroy()
  process.exit(1)
})

request.setTimeout(options.timeout)
request.end()
