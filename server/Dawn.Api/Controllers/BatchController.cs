using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dawn.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BatchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BatchController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Batch/all
        [HttpGet("all")]
        [Authorize(Roles = "Admin,Staff,Teacher")]
        public async Task<ActionResult<IEnumerable<Batch>>> GetAllBatches()
        {
            return await _context.Batches
                                 .OrderByDescending(b => b.StartDate)
                                 .ToListAsync();
        }

        // GET: api/Batch/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff,Teacher")]
        public async Task<ActionResult<Batch>> GetBatch(int id)
        {
            var batch = await _context.Batches.FindAsync(id);

            if (batch == null)
            {
                return NotFound();
            }

            return batch;
        }

        // POST: api/Batch/create
        [HttpPost("create")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<Batch>> CreateBatch([FromBody] Batch batch)
        {
            _context.Batches.Add(batch);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBatch), new { id = batch.Id }, batch);
        }
    }
}
