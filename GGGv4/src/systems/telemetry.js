export class Telemetry {
  constructor(){
    this.queue = [];
    window.addEventListener('error', (e)=>{
      this.queue.push({t:'error', m: String(e.message||'err'), ts: Date.now()});
    });
  }
  mark(name, data={}){
    this.queue.push({t:'mark', name, data, ts: Date.now()});
  }
  flush(){ this.queue.length = 0; }
}