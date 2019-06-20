import { Quantel } from '../index'
import * as spawn from './spawn_server'
import { app } from '../server'
import { Server } from 'http'
import * as request from 'request-promise-native'

describe('Zone-level REST API tests', () => {

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

	test('Zone information', async () => {
		await expect(request.get('http://localhost:3000/').then(JSON.parse))
		.resolves.toMatchObject([{
			type: 'ZonePortal',
			zoneNumber: 1000,
			zoneName: 'Zone 1000',
			isRemote: false
		} as Quantel.ZoneInfo, {
			type: 'ZonePortal',
			zoneNumber: 2000,
			zoneName: 'Zone 2000',
			isRemote: true
		} as Quantel.ZoneInfo ])
	})

	test('Zone information, zone by number', async () => {
		await expect(request.get('http://localhost:3000/1000.json').then(JSON.parse))
		.resolves.toMatchObject({
			type: 'ZonePortal',
			zoneNumber: 1000,
			zoneName: 'Zone 1000',
			isRemote: false
		})
	})

	test('Zone information, zone by name', async () => {
		await expect(request.get('http://localhost:3000/Zone 2000.json').then(JSON.parse))
		.resolves.toMatchObject({
			type: 'ZonePortal',
			zoneNumber: 2000,
			zoneName: 'Zone 2000',
			isRemote: true
		} as Quantel.ZoneInfo)
	})

	test('Get zone unknown', async () => {
		await expect(request.get('http://localhost:3000/whoami.json'))
		.rejects.toThrow('Could not find a zone called \'whoami\'')
		await expect(request.get('http://localhost:3000/whoami.json'))
		.rejects.toThrow('404')
	})

	test('Get zone paths', async () => {
		await expect(request.get('http://localhost:3000/default/').then(JSON.parse))
		.resolves.toMatchObject([ 'server/', 'clip/', 'format/' ])
	})

	test('Get servers', async () => {
		await expect(request.get('http://localhost:3000/default/server/').then(JSON.parse))
		.resolves.toMatchObject([{
			type: 'Server',
			ident: 1100,
			down: false,
			name: 'Server 1100',
			numChannels: 4,
			pools: [ 11 ],
			portNames: [ 'Port 1', 'Port 2' ],
			chanPorts: [ 'Port 1', 'Port 2', '', '' ] },
		{ type: 'Server',
			ident: 1200,
			down: true,
			name: 'Server 1200',
			numChannels: 2,
			pools: [ 12 ],
			portNames: [ 'Port 1' ],
			chanPorts: [ 'Port 1', '' ] },
		{ type: 'Server',
			ident: 1300,
			down: false,
			name: 'Server 1300',
			numChannels: 3,
			pools: [ 13 ],
			portNames: [ 'Port 1', 'Port 2' ],
			chanPorts: [ 'Port 1', 'Port 2', '' ] } ])
	})

	test('Get server by identifier', async () => {
		await expect(request.get('http://localhost:3000/default/server/1100.json').then(JSON.parse))
		.resolves.toMatchObject({
			type: 'Server',
			ident: 1100,
			down: false,
			name: 'Server 1100',
			numChannels: 4,
			pools: [ 11 ],
			portNames: [ 'Port 1', 'Port 2' ],
			chanPorts: [ 'Port 1', 'Port 2', '', '' ]
		})
	})

	test('Get server by name', async () => {
		await expect(request.get('http://localhost:3000/default/server/Server 1100.json').then(JSON.parse))
		.resolves.toMatchObject({
			type: 'Server',
			ident: 1100,
			down: false,
			name: 'Server 1100',
			numChannels: 4,
			pools: [ 11 ],
			portNames: [ 'Port 1', 'Port 2' ],
			chanPorts: [ 'Port 1', 'Port 2', '', '' ]
		})
	})

	test('Get server unknown', async () => {
		await expect(request.get('http://localhost:3000/default/server/whoami.json'))
		.rejects.toThrow('A server with identifier \'whoami\' was not found')
		await expect(request.get('http://localhost:3000/default/server/whoami.json'))
		.rejects.toThrow('404')
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
