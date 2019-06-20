import { Quantel } from '../index'
import * as spawn from './spawn_server'
import { app } from '../server'
import { Server } from 'http'
import * as request from 'request-promise-native'

describe('Clip-level REST API tests', () => {

	let isaIOR: string
	let server: Server

	beforeAll(async () => {
		isaIOR = await spawn.start()
		await new Promise((resolve, reject) => {
			server = app.listen(3000) // TODO change this to a config parameter
			server.on('listening', () => {
				resolve()
			})
			server.on('error', e => {
				reject(e)
			})
		})
	})

	test('Test connect', async () => {
		await expect(request.post('http://localhost:3000/connect/127.0.0.1').then(JSON.parse))
		.resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR } as Quantel.ConnectionDetails)
	})

	test('Retrieve a clip that exists', async () => {
		await expect(request.get('http://localhost:3000/default/clip/2').then(JSON.parse))
		.resolves.toEqual({
			ClipID: 2,
			Created: '2019-06-12T19:16:00.000Z',
			PlaceHolder: false,
			Title: 'Once upon a time in Quantel',
			type: 'ClipData'
		})
	})

	test('Attempt to retrieve a clip that does not exist', async () => {
		await expect(request.get('http://localhost:3000/default/clip/42'))
		.rejects.toThrow('A clip with identifier \'42\' was not found')
		await expect(request.get('http://localhost:3000/default/clip/42'))
		.rejects.toThrow('404')
	})

	test('Attempt to retrieve a clip with a name', async () => {
		await expect(request.get('http://localhost:3000/default/clip/whoami'))
		.rejects.toThrow('Clip ID must be a positive number')
		await expect(request.get('http://localhost:3000/default/clip/whoami'))
		.rejects.toThrow('400')
	})

	afterAll(async () => {
		await new Promise((resolve, reject) => {
			server.close(e => {
				if (e) {
					reject(e)
				} else { resolve() }
			})
		})
		await spawn.stop()
	})
})
