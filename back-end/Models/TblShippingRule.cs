// File: back_end/Models/TblShippingRule.cs
using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblShippingRule
{
    public int RuleId { get; set; }
    public bool IsBaseRule { get; set; } // true: Cước chuẩn, false: Cước lũy tiến
    public decimal WeightCriteria { get; set; } // VD: 5000 (gram)

    public decimal PriceInnerProvince { get; set; }
    public decimal PriceInnerRegion { get; set; }
    public decimal PriceInterRegion { get; set; }
}