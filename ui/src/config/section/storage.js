// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { shallowRef, defineAsyncComponent } from 'vue'
import store from '@/store'

export default {
  name: 'storage',
  title: 'label.storage',
  icon: 'hdd-outlined',
  children: [
    {
      name: 'volume',
      title: 'label.volumes',
      icon: 'hdd-outlined',
      docHelp: 'adminguide/storage.html#working-with-volumes',
      permission: ['listVolumesMetrics'],
      resourceType: 'Volume',
      filters: () => {
        if (store.getters.userInfo.roletype === 'Admin') {
          return ['user', 'all']
        } else {
          return []
        }
      },
      columns: () => {
        const fields = ['name', 'state', 'sizegb', 'type', 'vmname']
        const metricsFields = ['diskkbsread', 'diskkbswrite', 'diskiopstotal']

        if (store.getters.userInfo.roletype === 'Admin') {
          metricsFields.push('physicalsize')
        }
        metricsFields.push('utilization')

        if (store.getters.metrics) {
          fields.push(...metricsFields)
        }

        if (store.getters.userInfo.roletype === 'Admin') {
          fields.push('account')
          fields.push('storage')
        } else if (store.getters.userInfo.roletype === 'DomainAdmin') {
          fields.push('account')
        }
        fields.push('zonename')

        return fields
      },
      details: ['name', 'id', 'type', 'storagetype', 'diskofferingdisplaytext', 'deviceid', 'sizegb', 'physicalsize', 'provisioningtype', 'utilization', 'diskkbsread', 'diskkbswrite', 'diskioread', 'diskiowrite', 'diskiopstotal', 'miniops', 'maxiops', 'path'],
      related: [{
        name: 'snapshot',
        title: 'label.snapshots',
        param: 'volumeid'
      }],
      tabs: [
        {
          name: 'details',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/DetailsTab.vue')))
        },
        {
          name: 'metrics',
          resourceType: 'Volume',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/StatsTab.vue'))),
          show: (record) => { return store.getters.features.instancesdisksstatsretentionenabled }
        },
        {
          name: 'events',
          resourceType: 'Volume',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/EventsTab.vue'))),
          show: () => { return 'listEvents' in store.getters.apis }
        },
        {
          name: 'comments',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/AnnotationsTab.vue')))
        }
      ],
      searchFilters: () => {
        var filters = ['name', 'zoneid', 'domainid', 'account', 'state', 'tags']
        if (['Admin', 'DomainAdmin'].includes(store.getters.userInfo.roletype)) {
          filters.push('storageid')
        }
        return filters
      },
      actions: [
        {
          api: 'createVolume',
          icon: 'plus-outlined',
          docHelp: 'adminguide/storage.html#creating-a-new-volume',
          label: 'label.action.create.volume',
          listView: true,
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/CreateVolume.vue')))
        },
        {
          api: 'createVolume',
          icon: 'cloud-upload-outlined',
          docHelp: 'adminguide/storage.html#uploading-an-existing-volume-to-a-virtual-machine',
          label: 'label.upload.volume.from.local',
          show: () => { return 'getUploadParamsForVolume' in store.getters.apis },
          listView: true,
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/UploadLocalVolume.vue')))
        },
        {
          api: 'uploadVolume',
          icon: 'link-outlined',
          docHelp: 'adminguide/storage.html#uploading-an-existing-volume-to-a-virtual-machine',
          label: 'label.upload.volume.from.url',
          listView: true,
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/UploadVolume.vue')))
        },
        {
          api: 'attachVolume',
          icon: 'paper-clip-outlined',
          label: 'label.action.attach.disk',
          dataView: true,
          show: (record) => { return ['Allocated', 'Ready', 'Uploaded'].includes(record.state) && !('virtualmachineid' in record) },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/AttachVolume.vue')))
        },
        {
          api: 'detachVolume',
          icon: 'link-outlined',
          label: 'label.action.detach.disk',
          message: 'message.detach.disk',
          dataView: true,
          show: (record) => { return record.virtualmachineid && ['Running', 'Stopped', 'Destroyed'].includes(record.vmstate) }
        },
        {
          api: 'updateVolume',
          icon: 'edit-outlined',
          label: 'label.edit',
          dataView: true,
          args: ['name'],
          mapping: {
            account: {
              value: (record) => { return record.account }
            },
            domainid: {
              value: (record) => { return record.domainid }
            }
          }
        },
        {
          api: 'createSnapshot',
          icon: 'camera-outlined',
          docHelp: 'adminguide/storage.html#working-with-volume-snapshots',
          label: 'label.action.take.snapshot',
          dataView: true,
          show: (record, store) => {
            return record.state === 'Ready' && (record.hypervisor !== 'KVM' ||
              record.hypervisor === 'KVM' && record.vmstate === 'Running' && store.features.kvmsnapshotenabled ||
              record.hypervisor === 'KVM' && record.vmstate !== 'Running')
          },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/TakeSnapshot.vue')))
        },
        {
          api: 'createSnapshotPolicy',
          icon: 'clock-circle-outlined',
          docHelp: 'adminguide/storage.html#working-with-volume-snapshots',
          label: 'label.action.recurring.snapshot',
          dataView: true,
          show: (record, store) => {
            return record.state === 'Ready' && (record.hypervisor !== 'KVM' ||
              record.hypervisor === 'KVM' && record.vmstate === 'Running' && store.features.kvmsnapshotenabled ||
              record.hypervisor === 'KVM' && record.vmstate !== 'Running')
          },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/RecurringSnapshotVolume.vue'))),
          mapping: {
            volumeid: {
              value: (record) => { return record.id }
            },
            intervaltype: {
              options: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']
            }
          }
        },
        {
          api: 'resizeVolume',
          icon: 'fullscreen-outlined',
          docHelp: 'adminguide/storage.html#resizing-volumes',
          label: 'label.action.resize.volume',
          dataView: true,
          popup: true,
          show: (record) => { return ['Allocated', 'Ready'].includes(record.state) },
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/ResizeVolume.vue')))
        },
        {
          api: 'migrateVolume',
          permission: ['migrateVolume', 'findStoragePoolsForMigration', 'listStoragePools', 'listDiskOfferings'],
          icon: 'drag-outlined',
          docHelp: 'adminguide/storage.html#id2',
          label: 'label.migrate.volume',
          args: ['volumeid', 'storageid', 'livemigrate'],
          dataView: true,
          show: (record, store) => { return record.state === 'Ready' },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/MigrateVolume.vue')))
        },
        {
          api: 'changeOfferingForVolume',
          icon: 'swap-outlined',
          docHelp: 'adminguide/storage.html#id2',
          label: 'label.change.offering.for.volume',
          args: ['id', 'diskofferingid', 'size', 'miniops', 'maxiops', 'automigrate'],
          dataView: true,
          show: (record, store) => { return ['Allocated', 'Ready'].includes(record.state) && ['Admin'].includes(store.userInfo.roletype) },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/ChangeOfferingForVolume.vue')))
        },
        {
          api: 'extractVolume',
          icon: 'cloud-download-outlined',
          label: 'label.action.download.volume',
          message: 'message.download.volume.confirm',
          dataView: true,
          show: (record) => { return record.state === 'Ready' && (record.vmstate === 'Stopped' || !record.virtualmachineid) },
          args: ['zoneid', 'mode'],
          mapping: {
            zoneid: {
              value: (record) => { return record.zoneid }
            },
            mode: {
              value: (record) => { return 'HTTP_DOWNLOAD' }
            }
          },
          response: (result) => { return `Please click <a href="${result.volume.url}" target="_blank">${result.volume.url}</a> to download.` }
        },
        {
          api: 'createTemplate',
          icon: 'picture-outlined',
          label: 'label.action.create.template.from.volume',
          dataView: true,
          show: (record) => {
            return !['Destroy', 'Destroyed', 'Expunging', 'Expunged', 'Migrating', 'Uploading', 'UploadError', 'Creating'].includes(record.state) &&
            ((record.type === 'ROOT' && record.vmstate === 'Stopped') ||
            (record.type !== 'ROOT' && !record.virtualmachineid && !['Allocated', 'Uploaded'].includes(record.state)))
          },
          args: (record, store) => {
            var fields = ['volumeid', 'name', 'displaytext', 'ostypeid', 'ispublic', 'isfeatured', 'isdynamicallyscalable', 'requireshvm', 'passwordenabled']
            if (['Admin', 'DomainAdmin'].includes(store.userInfo.roletype)) {
              fields.push('domainid')
              fields.push('account')
            }
            return fields
          },
          mapping: {
            volumeid: {
              value: (record) => { return record.id }
            }
          }
        },
        {
          api: 'recoverVolume',
          icon: 'medicine-box-outlined',
          label: 'label.action.recover.volume',
          message: 'message.action.recover.volume',
          dataView: true,
          show: (record, store) => {
            return (['Admin', 'DomainAdmin'].includes(store.userInfo.roletype) || store.features.allowuserexpungerecovervolume) && record.state === 'Destroy'
          }
        },
        {
          api: 'deleteVolume',
          icon: 'delete-outlined',
          label: 'label.action.delete.volume',
          message: 'message.action.delete.volume',
          dataView: true,
          show: (record, store) => {
            return ['Expunging', 'Expunged', 'UploadError'].includes(record.state) ||
              ['Allocated', 'Uploaded'].includes(record.state) && record.type !== 'ROOT' && !record.virtualmachineid ||
              ((['Admin', 'DomainAdmin'].includes(store.userInfo.roletype) || store.features.allowuserexpungerecovervolume) && record.state === 'Destroy')
          },
          groupAction: true,
          popup: true,
          groupMap: (selection) => { return selection.map(x => { return { id: x } }) }
        },
        {
          api: 'destroyVolume',
          icon: 'delete-outlined',
          label: 'label.action.destroy.volume',
          message: 'message.action.destroy.volume',
          dataView: true,
          args: (record, store) => {
            return (['Admin'].includes(store.userInfo.roletype) || store.features.allowuserexpungerecovervolume)
              ? ['expunge'] : []
          },
          show: (record, store) => {
            return !['Destroy', 'Destroyed', 'Expunging', 'Expunged', 'Migrating', 'Uploading', 'UploadError', 'Creating', 'Allocated', 'Uploaded'].includes(record.state) &&
              record.type !== 'ROOT' && !record.virtualmachineid
          }
        }
      ]
    },
    {
      name: 'snapshot',
      title: 'label.snapshots',
      icon: 'build-outlined',
      docHelp: 'adminguide/storage.html#working-with-volume-snapshots',
      permission: ['listSnapshots'],
      resourceType: 'Snapshot',
      columns: () => {
        var fields = ['name', 'state', 'volumename', 'intervaltype', 'physicalsize', 'created']
        if (['Admin', 'DomainAdmin'].includes(store.getters.userInfo.roletype)) {
          fields.push('account')
          fields.push('domain')
        }
        fields.push('zonename')
        return fields
      },
      details: ['name', 'id', 'volumename', 'volumetype', 'snapshottype', 'intervaltype', 'physicalsize', 'virtualsize', 'account', 'domain', 'created'],
      tabs: [
        {
          name: 'details',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/DetailsTab.vue')))
        },
        {
          name: 'zones',
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/SnapshotZones.vue')))
        },
        {
          name: 'events',
          resourceType: 'Snapshot',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/EventsTab.vue'))),
          show: () => { return 'listEvents' in store.getters.apis }
        },
        {
          name: 'comments',
          component: shallowRef(defineAsyncComponent(() => import('@/components/view/AnnotationsTab.vue')))
        }
      ],
      searchFilters: () => {
        var filters = ['name', 'domainid', 'account', 'tags', 'zoneid']
        if (['Admin', 'DomainAdmin'].includes(store.getters.userInfo.roletype)) {
          filters.push('storageid')
          filters.push('imagestoreid')
        }
        return filters
      },
      actions: [
        {
          api: 'createTemplate',
          icon: 'picture-outlined',
          label: 'label.create.template',
          dataView: true,
          show: (record) => { return record.state === 'BackedUp' },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/CreateTemplate.vue')))
        },
        {
          api: 'createVolume',
          icon: 'hdd-outlined',
          label: 'label.action.create.volume',
          dataView: true,
          show: (record) => { return record.state === 'BackedUp' },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/CreateVolume.vue')))
        },
        {
          api: 'revertSnapshot',
          icon: 'sync-outlined',
          label: 'label.action.revert.snapshot',
          message: 'message.action.revert.snapshot',
          dataView: true,
          show: (record) => { return record.state === 'BackedUp' && record.revertable }
        },
        {
          api: 'deleteSnapshot',
          icon: 'delete-outlined',
          label: 'label.action.delete.snapshot',
          message: 'message.action.delete.snapshot',
          dataView: true,
          show: (record) => { return record.state !== 'Destroyed' },
          groupAction: true,
          popup: true,
          groupMap: (selection) => { return selection.map(x => { return { id: x } }) }
        }
      ]
    },
    {
      name: 'backup',
      title: 'label.backup',
      icon: 'cloud-upload-outlined',
      permission: ['listBackups'],
      columns: [{ name: (record) => { return record.virtualmachinename } }, 'status', 'virtualmachinename', 'type', 'created', 'account', 'domain', 'zone'],
      details: ['virtualmachinename', 'id', 'type', 'externalid', 'size', 'virtualsize', 'volumes', 'backupofferingname', 'zone', 'account', 'domain', 'created'],
      actions: [
        {
          api: 'restoreBackup',
          icon: 'sync-outlined',
          docHelp: 'adminguide/virtual_machines.html#restoring-vm-backups',
          label: 'label.backup.restore',
          message: 'message.backup.restore',
          dataView: true,
          show: (record) => { return record.state !== 'Destroyed' }
        },
        {
          api: 'restoreVolumeFromBackupAndAttachToVM',
          icon: 'paper-clip-outlined',
          label: 'label.backup.attach.restore',
          message: 'message.backup.attach.restore',
          dataView: true,
          show: (record) => { return record.state !== 'Destroyed' },
          popup: true,
          component: shallowRef(defineAsyncComponent(() => import('@/views/storage/RestoreAttachBackupVolume.vue')))
        },
        {
          api: 'removeVirtualMachineFromBackupOffering',
          icon: 'scissor-outlined',
          label: 'label.backup.offering.remove',
          message: 'message.backup.offering.remove',
          dataView: true,
          show: (record) => { return record.state !== 'Destroyed' },
          args: ['forced', 'virtualmachineid'],
          mapping: {
            forced: {
              value: (record) => { return true }
            },
            virtualmachineid: {
              value: (record) => { return record.virtualmachineid }
            }
          }
        },
        {
          api: 'deleteBackup',
          icon: 'delete-outlined',
          label: 'label.delete.backup',
          message: 'message.delete.backup',
          dataView: true,
          show: (record) => { return record.state !== 'Destroyed' }
        }
      ]
    }
  ]
}
