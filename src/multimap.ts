
export class MultiMap<K, V> {
   private Map<K, Array<V>> data

   constructor() {
      data = new Map()
   }

   get(key : K) {
      return 
   }

   set(key, value) {
      if (this[key] === undefined) {
         this[key] = []
      }
      this[key].push(value)
   }

   erase(key) {
      delete this[key]
   }

   clear() {
      for (const key of Object.keys(this)) {
         delete this[key]
      }
   }

   union(that) {
      for (const key of Object.keys(that)) {
         if (this[key] === undefined) {
            this[key] = []
         }
         for (const t of that[key]) {
            this[key].push(t)
         }
      }
   }

   keys() {
      return Object.keys(this)
   }

   values() {
      const x = []
      for (const key of Object.keys(this)) {
         for (const v of this[key]) {
            x.push(v)
         }
      }
      return x
   }

   forEach(f) {
      for (const key of Object.keys(this)) {
         for (const v of this[key]) {
            f(key, v)
         }
      }
   }
}

