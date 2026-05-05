<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Industry;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class IndustryController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success(Industry::values(), 'Industries fetched.');
    }
}
