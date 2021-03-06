/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

import * as assert from 'assert'
import * as sinon from 'sinon'
import { DefaultRegionProvider } from '../../../shared/regions/defaultRegionProvider'
import { Endpoints } from '../../../shared/regions/endpoints'
import { EndpointsProvider } from '../../../shared/regions/endpointsProvider'
import { ResourceFetcher } from '../../../shared/resourcefetcher/resourcefetcher'

const sampleEndpoints = {
    partitions: [
        {
            dnsSuffix: 'totallyLegit.tld',
            partition: 'aws',
            partitionName: 'Standard',
            regions: {
                region1: {
                    description: 'aws region one',
                },
                region2: {
                    description: 'aws region two',
                },
                region3: {
                    description: 'aws region three',
                },
            },
        },
        {
            dnsSuffix: 'totallyLegit.cn',
            partition: 'aws-cn',
            partitionName: 'China',
            regions: {
                awscnregion1: {
                    description: 'aws-cn region one',
                },
            },
        },
    ],
}

describe('DefaultRegionProvider', async function () {
    const resourceFetcher: ResourceFetcher = {
        get: async () => {
            return JSON.stringify(sampleEndpoints)
        },
    }

    describe('isServiceInRegion', async function () {
        let sandbox: sinon.SinonSandbox

        let endpoints: Endpoints
        let endpointsProvider: EndpointsProvider

        const regionCode = 'someRegion'
        const serviceId = 'someService'

        beforeEach(function () {
            sandbox = sinon.createSandbox()

            endpoints = {
                partitions: [
                    {
                        dnsSuffix: 'totallyLegit.tld',
                        id: 'aws',
                        name: '',
                        regions: [
                            {
                                id: regionCode,
                                name: '',
                            },
                        ],
                        services: [
                            {
                                id: serviceId,
                                endpoints: [
                                    {
                                        regionId: regionCode,
                                        data: {},
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }

            endpointsProvider = new EndpointsProvider(resourceFetcher, resourceFetcher)
            sandbox.stub(endpointsProvider, 'getEndpoints').returns(endpoints)
        })

        afterEach(function () {
            sandbox.restore()
        })

        it('indicates when a service is in a region', async function () {
            const regionProvider = new DefaultRegionProvider(endpointsProvider)

            assert.ok(regionProvider.isServiceInRegion(serviceId, regionCode), 'Expected service to be in region')
        })

        it('indicates when a service is not in a region', async function () {
            const regionProvider = new DefaultRegionProvider(endpointsProvider)

            assert.ok(
                !regionProvider.isServiceInRegion(`${serviceId}x`, regionCode),
                'Expected service not to be in region'
            )
        })
    })

    describe('getDnsSuffixForRegion', async function () {
        let endpointsProvider: EndpointsProvider
        let regionProvider: DefaultRegionProvider

        beforeEach(async function () {
            endpointsProvider = new EndpointsProvider(resourceFetcher, resourceFetcher)
            await endpointsProvider.load()

            regionProvider = new DefaultRegionProvider(endpointsProvider)
        })

        it('gets DNS suffix for a known region', async function () {
            const partitionId = regionProvider.getDnsSuffixForRegion('region1')
            assert.strictEqual(partitionId, 'totallyLegit.tld')
        })

        it('returns undefined for an unknown region', async function () {
            const partitionId = regionProvider.getDnsSuffixForRegion('foo')
            assert.strictEqual(partitionId, undefined)
        })
    })

    describe('getPartitionId', async function () {
        let endpointsProvider: EndpointsProvider
        let regionProvider: DefaultRegionProvider

        beforeEach(async function () {
            endpointsProvider = new EndpointsProvider(resourceFetcher, resourceFetcher)
            await endpointsProvider.load()

            regionProvider = new DefaultRegionProvider(endpointsProvider)
        })

        it('gets partition for a known region', async function () {
            const partitionId = regionProvider.getPartitionId('awscnregion1')
            assert.strictEqual(partitionId, 'aws-cn')
        })

        it('returns undefined for an unknown region', async function () {
            const partitionId = regionProvider.getPartitionId('foo')
            assert.strictEqual(partitionId, undefined)
        })
    })

    describe('getRegions', async function () {
        let endpointsProvider: EndpointsProvider
        let regionProvider: DefaultRegionProvider

        beforeEach(async function () {
            endpointsProvider = new EndpointsProvider(resourceFetcher, resourceFetcher)
            await endpointsProvider.load()

            regionProvider = new DefaultRegionProvider(endpointsProvider)
        })

        it('gets regions for a known partition', async function () {
            const regions = regionProvider.getRegions('aws')
            assert.ok(regions)
            assert.strictEqual(regions.length, 3, 'Unexpected amount of regions returned')
        })

        it('returns empty array for an unknown partition', async function () {
            const regions = regionProvider.getRegions('foo')
            assert.ok(regions)
            assert.strictEqual(regions.length, 0, 'Unexpected regions returned')
        })
    })
})
